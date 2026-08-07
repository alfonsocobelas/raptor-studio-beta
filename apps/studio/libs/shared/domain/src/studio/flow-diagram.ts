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
  width: 180,
  height: 56
} as const

export function flowNodeBox(position: NodePosition): NodeBox {
  return { x: position.x, y: position.y, width: FLOW_NODE.width, height: FLOW_NODE.height }
}

/**
 * Capa = distancia BFS al start; dentro de cada capa, orden alfabético por id.
 * Los nodos inalcanzables (el gate ya los rechaza) caen en una capa extra al
 * final para que nunca desaparezcan del lienzo. Sin start → layout vacío.
 */
export function flowLayout(flow: BusinessFlow): Record<string, NodePosition> {
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

  const positions: Record<string, NodePosition> = {}
  for (const [depth, ids] of layers) {
    ;[...ids].sort().forEach((id, column) => {
      positions[id] = {
        x: FLOW_GRID.margin + column * FLOW_GRID.colWidth,
        y: FLOW_GRID.margin + depth * FLOW_GRID.rowHeight
      }
    })
  }
  return positions
}
