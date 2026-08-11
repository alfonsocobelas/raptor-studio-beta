import type { BusinessFlow } from '@acc/schema'
import type { NodeBox, NodePosition } from './model-diagram'

/**
 * Helpers puros de la vista de flujos (spec 28). Como en la vista de modelo,
 * el layout es cosmético: capas BFS deterministas que viven en memoria del
 * componente y jamás entran al app-schema.
 */
export const FLOW_GRID = {
  colWidth: 220,
  rowHeight: 130,
  margin: 40
} as const

/** Dimensiones fijas del nodo de flujo: el rombo y la píldora son CSS, no geometría. */
export const FLOW_NODE = {
  width: 200,
  height: 62
} as const

export function flowNodeBox(position: NodePosition): NodeBox {
  return { x: position.x, y: position.y, width: FLOW_NODE.width, height: FLOW_NODE.height }
}

/**
 * Capa = distancia BFS al start; dentro de cada capa, orden alfabético por id.
 * Los nodos inalcanzables (el gate ya los rechaza) caen en una capa extra al
 * final para que nunca desaparezcan del lienzo. Sin start → layout vacío.
 */
/** El proceso se puede leer en fila (izquierda→derecha) o en columna (arriba→abajo). */
export type FlowOrientation = 'horizontal' | 'vertical'

/** ¿Se pisan dos nodos colocados en estas posiciones? */
function seSolapan(a: NodePosition, b: NodePosition): boolean {
  return (
    a.x < b.x + FLOW_NODE.width &&
    b.x < a.x + FLOW_NODE.width &&
    a.y < b.y + FLOW_NODE.height &&
    b.y < a.y + FLOW_NODE.height
  )
}

/**
 * @param frozen Posiciones ya colocadas (arrastradas o congeladas por una edición
 *   anterior): se respetan TAL CUAL. Editar la topología —borrar un paso, meter uno
 *   en medio— no puede reordenar lo que el ojo ya tenía situado; el layout por capas
 *   solo decide dónde aterrizan los nodos que aún no tienen sitio.
 */
export function flowLayout(
  flow: BusinessFlow,
  orientation: FlowOrientation = 'horizontal',
  frozen: Record<string, NodePosition> = {}
): Record<string, NodePosition> {
  const start = flow.nodes.find(node => node.kind === 'start')
  if (!start) return {}

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
  const layers = new Map<number, string[]>()
  for (const node of flow.nodes) {
    const depth = depthOf.get(node.id) ?? deepest + 1
    layers.set(depth, [...(layers.get(depth) ?? []), node.id])
  }

  // La capa avanza en el eje del proceso y los nodos que la comparten (las ramas de
  // una decisión) se reparten en el eje perpendicular. Lo congelado no se toca; lo
  // demás aterriza en su hueco de capa y, si está pisado, se aparta una fila.
  const positions: Record<string, NodePosition> = {}
  for (const node of flow.nodes) if (frozen[node.id]) positions[node.id] = frozen[node.id]

  const libre = (candidato: NodePosition) =>
    !Object.values(positions).some(puesta => seSolapan(candidato, puesta))

  for (const [depth, ids] of layers) {
    ;[...ids].sort().forEach((sibling, index) => {
      if (positions[sibling]) return
      const slot = (paso: number): NodePosition =>
        orientation === 'horizontal'
          ? {
              x: FLOW_GRID.margin + depth * FLOW_GRID.colWidth,
              y: FLOW_GRID.margin + (index + paso) * FLOW_GRID.rowHeight
            }
          : {
              x: FLOW_GRID.margin + (index + paso) * FLOW_GRID.colWidth,
              y: FLOW_GRID.margin + depth * FLOW_GRID.rowHeight
            }
      let paso = 0
      // tope defensivo: mejor un solape que un bucle infinito en un render
      while (paso < 50 && !libre(slot(paso))) paso++
      positions[sibling] = slot(paso)
    })
  }
  return positions
}

export interface FlowEdgeCurve {
  x1: number
  y1: number
  x2: number
  y2: number
  /** Trazo SVG listo para `path[d]` */
  d: string
  labelX: number
  labelY: number
}

/**
 * La flecha de un flujo es HORIZONTAL: el proceso avanza por columnas, así que sale
 * por el costado del nodo y entra por el costado del siguiente, con los tiradores en
 * horizontal para que el trazo salga y entre plano. Si el destino queda a la izquierda
 * (un bucle hacia atrás), se invierten los lados en vez de cruzar el nodo.
 */
export function flowEdgeCurve(from: NodeBox, to: NodeBox, orientation: FlowOrientation = 'horizontal'): FlowEdgeCurve {
  if (orientation === 'vertical') {
    const haciaAbajo = to.y >= from.y
    const x1 = from.x + from.width / 2
    const x2 = to.x + to.width / 2
    const y1 = haciaAbajo ? from.y + from.height : from.y
    const y2 = haciaAbajo ? to.y : to.y + to.height

    const tirador = Math.max(24, Math.abs(y2 - y1) / 2)
    const cy1 = haciaAbajo ? y1 + tirador : y1 - tirador
    const cy2 = haciaAbajo ? y2 - tirador : y2 + tirador

    return {
      x1,
      y1,
      x2,
      y2,
      d: `M ${x1} ${y1} C ${x1} ${cy1}, ${x2} ${cy2}, ${x2} ${y2}`,
      labelX: (x1 + x2) / 2,
      labelY: (y1 + y2) / 2
    }
  }

  const haciaLaDerecha = to.x >= from.x
  const y1 = from.y + from.height / 2
  const y2 = to.y + to.height / 2
  const x1 = haciaLaDerecha ? from.x + from.width : from.x
  const x2 = haciaLaDerecha ? to.x : to.x + to.width

  const tirador = Math.max(24, Math.abs(x2 - x1) / 2)
  const cx1 = haciaLaDerecha ? x1 + tirador : x1 - tirador
  const cx2 = haciaLaDerecha ? x2 - tirador : x2 + tirador

  return {
    x1,
    y1,
    x2,
    y2,
    d: `M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`,
    labelX: (x1 + x2) / 2,
    labelY: (y1 + y2) / 2
  }
}

/**
 * Número de orden de cada PASO, como en la referencia: los pasos se leen «1, 2, 3»
 * siguiendo el recorrido del proceso. El inicio, las decisiones y los fines no se
 * numeran —no son trabajo, son estructura— y un paso suelto se numera al final,
 * porque está en el lienzo aunque no cuelgue de nada.
 */
export function flowStepNumbers(flow: BusinessFlow): Record<string, number> {
  const start = flow.nodes.find(node => node.kind === 'start')
  const orden: string[] = []
  const visto = new Set<string>()

  if (start) {
    const cola = [start.id]
    visto.add(start.id)
    while (cola.length) {
      const actual = cola.shift() as string
      orden.push(actual)
      for (const edge of flow.edges) {
        if (edge.from !== actual || visto.has(edge.to)) continue
        visto.add(edge.to)
        cola.push(edge.to)
      }
    }
  }
  for (const node of flow.nodes) if (!visto.has(node.id)) orden.push(node.id)

  const kinds = new Map(flow.nodes.map(node => [node.id, node.kind]))
  const numeros: Record<string, number> = {}
  let siguiente = 1
  for (const id of orden) if (kinds.get(id) === 'step') numeros[id] = siguiente++
  return numeros
}

/**
 * Salidas ALTERNATIVAS de las decisiones: la primera es el camino principal y el
 * resto son las alternativas, que la referencia dibuja en trazo discontinuo. Solo
 * cuenta lo que sale de una decisión: un paso con dos salidas no bifurca, va a dos
 * sitios. La clave es `from→to`, la misma identidad que usa el lienzo.
 */
export function flowAlternateEdges(flow: BusinessFlow): Set<string> {
  const decisiones = new Set(flow.nodes.filter(node => node.kind === 'decision').map(node => node.id))
  const vistas = new Set<string>()
  const alternativas = new Set<string>()

  for (const edge of flow.edges) {
    if (!decisiones.has(edge.from)) continue
    if (vistas.has(edge.from)) alternativas.add(`${edge.from}→${edge.to}`)
    vistas.add(edge.from)
  }
  return alternativas
}
