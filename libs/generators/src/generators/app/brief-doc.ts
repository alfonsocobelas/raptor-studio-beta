import type { BusinessBrief, BusinessFlow, FlowEdge, FlowNode, ResourceDefinition } from '@raptor/schema'

/**
 * El brief aterriza como CLAUDE.md en la raíz de la app generada (spec 22): la memoria del negocio
 * que acompaña al código. No genera ni altera un byte de código (regla 7) — es la documentación que
 * la spec de los huecos @ai leerá algún día. Markdown construido aquí (regla 8): la plantilla solo
 * interpola el resultado.
 */
export function renderClaudeMd(
  appName: string,
  brief: BusinessBrief,
  models: ResourceDefinition[],
  flows?: BusinessFlow[]
): string {
  const sections: string[] = [
    `# ${appName} — contexto del negocio`,
    '',
    '> Destilado de la conversación de diseño en el estudio. Corrige aquí lo que cambie:',
    '> este fichero es la memoria del negocio que acompaña al código generado.',
    '',
    '## Negocio',
    '',
    brief.business
  ]

  if (brief.rules?.length) {
    sections.push('', '## Reglas', '', ...brief.rules.map(rule => `- ${rule}`))
  }

  if (brief.glossary?.length) {
    sections.push('', '## Glosario', '', ...brief.glossary.map(entry => `- **${entry.term}**: ${entry.means}`))
  }

  const withBrief = models.filter(model => model.brief)
  if (withBrief.length) {
    sections.push(
      '',
      '## Entidades',
      '',
      ...withBrief.map(model => `- **${model.labels?.singular ?? model.name}**: ${model.brief}`)
    )
  }

  const processes = renderFlows(flows)
  if (processes) {
    sections.push('', processes.trimEnd())
  }

  return sections.join('\n') + '\n'
}

/**
 * Los flujos (spec 28) como esquema numerado legible: orden del proceso desde el start
 * (el mismo que dibuja el estudio), ramas etiquetadas de las decisiones y saltos
 * no secuenciales explícitos. Sin flujos, cadena vacía — el brief queda como está.
 */
export function renderFlows(flows: BusinessFlow[] | undefined): string {
  if (!flows?.length) return ''

  const sections = ['## Procesos de negocio']
  for (const flow of flows) {
    sections.push('', `### ${flow.name}`, '')
    if (flow.description) sections.push(flow.description, '')

    sections.push(...renderFlowSteps(flow))
  }
  return sections.join('\n') + '\n'
}

/**
 * Las líneas numeradas de UN flujo, sin cabeceras markdown: la pieza que comparten el
 * CLAUDE.md (spec 28) y el JSDoc de la clase de proceso emitida (spec 39). Un solo
 * mapa numerado en todo el proyecto — divergencia imposible por construcción.
 */
export function renderFlowSteps(flow: BusinessFlow): string[] {
  const order = flowOrder(flow)
  const numberOf = new Map(order.map((node, i) => [node.id, i + 1]))

  const lines: string[] = []
  order.forEach((node, i) => {
    lines.push(`${i + 1}. ${describeNode(node)}`)
    const outgoing = flow.edges.filter(e => e.from === node.id)
    for (const edge of outgoing) {
      const target = numberOf.get(edge.to)
      if (target === undefined) continue
      // las ramas etiquetadas siempre se listan; un paso al siguiente número es implícito
      if (edge.label !== undefined) {
        lines.push(`   - ${edge.label} → ${target}`)
      } else if (target !== i + 2) {
        lines.push(`   - → ${target}`)
      }
    }
  })
  return lines
}

function describeNode(node: FlowNode): string {
  const marker = node.kind === 'start' ? '(inicio) ' : node.kind === 'end' ? '(fin) ' : ''
  const entity = node.entity ? ` · entidad: ${node.entity}` : ''
  return `${marker}${node.text}${entity}`
}

/**
 * ORDEN DEL PROCESO (spec 40): un nodo nunca sale antes que los nodos de los que depende, y
 * las acciones de una misma cadena salen SEGUIDAS. Es el orden en que se lee el flujo en el
 * lienzo del estudio, y por tanto el orden en que se numeran los pasos y se emiten los
 * métodos de la clase de proceso.
 *
 * Antes se ordenaba por profundidad BFS —primer descubrimiento—, que NO es topológico: con
 * ramas de distinta longitud el nodo donde se juntan se colaba delante de las acciones que
 * llevan a él, y dos tarjetas hermanas se entrelazaban capa a capa.
 *
 * Es un Kahn con dos precisiones:
 * - **pila, no cola**: al liberar un nodo se atiende lo antes posible, así que una cadena se
 *   agota antes de empezar la rama de al lado (es lo que las mantiene seguidas).
 * - **las vueltas atrás no cuentan** como dependencia: un flujo con un bucle
 *   («subsanar → revisar») no es un DAG y sin esto no habría orden posible. Se detectan con
 *   un recorrido en profundidad desde el inicio: arista hacia un nodo que sigue abierto.
 *
 * Determinista: los empates se rompen por id, y lo inalcanzable va al final, en alfabético.
 */
export function flowOrder(flow: BusinessFlow): FlowNode[] {
  const start = flow.nodes.find(n => n.kind === 'start')
  if (!start) return [...flow.nodes]

  const byId = new Map(flow.nodes.map(node => [node.id, node]))
  const salidas = (id: string) => flow.edges.filter(edge => edge.from === id && byId.has(edge.to) && edge.to !== id)
  const back = backEdges(flow, start.id, salidas)
  const alcanzable = reachable(start.id, salidas)
  // dependencia REAL de un nodo: una arista que viene de algo que cuelga del inicio y que no
  // es una vuelta atrás. Sin lo primero, un nodo suelto que apunte al fin lo bloquearía.
  const dependencias = (id: string) =>
    flow.edges.filter(
      edge => edge.to === id && edge.from !== id && alcanzable.has(edge.from) && !back.has(edgeKey(edge))
    ).length

  const pendientes = new Map(flow.nodes.map(node => [node.id, dependencias(node.id)]))
  const listos = [start.id]
  const emitido = new Set<string>()
  const order: FlowNode[] = []
  while (listos.length) {
    const id = listos.pop() as string
    if (emitido.has(id)) continue
    emitido.add(id)
    order.push(byId.get(id) as FlowNode)

    const liberados: string[] = []
    for (const edge of salidas(id)) {
      if (back.has(edgeKey(edge)) || emitido.has(edge.to)) continue
      const quedan = (pendientes.get(edge.to) as number) - 1
      pendientes.set(edge.to, quedan)
      if (quedan === 0) liberados.push(edge.to)
    }
    // se apilan al revés: la pila atiende el último, así que sale primero el menor por id
    listos.push(...liberados.sort((a, b) => b.localeCompare(a)))
  }

  // lo que no cuelga del inicio no tiene sitio en el proceso: va detrás, en alfabético
  const huerfanos = flow.nodes.filter(node => !emitido.has(node.id)).sort((a, b) => a.id.localeCompare(b.id))
  return [...order, ...huerfanos]
}

const edgeKey = (edge: FlowEdge) => `${edge.from}→${edge.to}`

/** Lo que cuelga del inicio siguiendo flechas; lo demás no es parte del proceso. */
function reachable(startId: string, salidas: (id: string) => FlowEdge[]): Set<string> {
  const vistos = new Set([startId])
  const pila = [startId]
  while (pila.length) {
    for (const edge of salidas(pila.pop() as string)) {
      if (vistos.has(edge.to)) continue
      vistos.add(edge.to)
      pila.push(edge.to)
    }
  }
  return vistos
}

/**
 * Aristas que CIERRAN un bucle, vistas desde el inicio: las que apuntan a un nodo cuyo
 * recorrido aún está abierto. No son dependencias —son vueltas atrás— y se ignoran al
 * ordenar; si contaran, el nodo al que vuelven nunca quedaría libre.
 */
function backEdges(flow: BusinessFlow, startId: string, salidas: (id: string) => FlowEdge[]): Set<string> {
  const back = new Set<string>()
  const abiertos = new Set<string>()
  const cerrados = new Set<string>()

  const visitar = (id: string): void => {
    abiertos.add(id)
    for (const edge of salidas(id)) {
      if (abiertos.has(edge.to)) back.add(edgeKey(edge))
      else if (!cerrados.has(edge.to)) visitar(edge.to)
    }
    abiertos.delete(id)
    cerrados.add(id)
  }
  visitar(startId)
  return back
}
