import type { BusinessBrief, BusinessFlow, FlowNode, ResourceDefinition } from '@acc/schema'

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
 * Los flujos (spec 28) como esquema numerado legible: orden BFS desde el start
 * (el mismo que dibuja el estudio), ramas etiquetadas de las decisiones y saltos
 * no secuenciales explícitos. Sin flujos, cadena vacía — el brief queda como está.
 */
export function renderFlows(flows: BusinessFlow[] | undefined): string {
  if (!flows?.length) return ''

  const sections = ['## Procesos de negocio']
  for (const flow of flows) {
    sections.push('', `### ${flow.name}`, '')
    if (flow.description) sections.push(flow.description, '')

    const order = bfsOrder(flow)
    const numberOf = new Map(order.map((node, i) => [node.id, i + 1]))

    order.forEach((node, i) => {
      sections.push(`${i + 1}. ${describeNode(node)}`)
      const outgoing = flow.edges.filter(e => e.from === node.id)
      for (const edge of outgoing) {
        const target = numberOf.get(edge.to)
        if (target === undefined) continue
        // las ramas etiquetadas siempre se listan; un paso al siguiente número es implícito
        if (edge.label !== undefined) {
          sections.push(`   - ${edge.label} → ${target}`)
        } else if (target !== i + 2) {
          sections.push(`   - → ${target}`)
        }
      }
    })
  }
  return sections.join('\n') + '\n'
}

function describeNode(node: FlowNode): string {
  const marker = node.kind === 'start' ? '(inicio) ' : node.kind === 'end' ? '(fin) ' : ''
  const entity = node.entity ? ` · entidad: ${node.entity}` : ''
  return `${marker}${node.text}${entity}`
}

/** Capa = distancia BFS al start; dentro de cada capa, orden alfabético por id (determinista). */
function bfsOrder(flow: BusinessFlow): FlowNode[] {
  const start = flow.nodes.find(n => n.kind === 'start')
  if (!start) return [...flow.nodes]

  const depthOf = new Map<string, number>([[start.id, 0]])
  const queue = [start.id]
  while (queue.length) {
    const current = queue.shift() as string
    const depth = depthOf.get(current) as number
    for (const edge of flow.edges) {
      if (edge.from !== current || depthOf.has(edge.to)) continue
      depthOf.set(edge.to, depth + 1)
      queue.push(edge.to)
    }
  }
  const deepest = Math.max(...depthOf.values())
  return [...flow.nodes].sort((a, b) => {
    const da = depthOf.get(a.id) ?? deepest + 1
    const db = depthOf.get(b.id) ?? deepest + 1
    return da - db || a.id.localeCompare(b.id)
  })
}
