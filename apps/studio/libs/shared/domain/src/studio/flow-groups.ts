import type { BusinessFlow, FlowEdge, FlowNode } from '@raptor/schema'
import type { NodeBox, NodePosition } from './model-diagram'

/**
 * AGRUPAR ACCIONES (referencia 12A): las acciones que van una detrás de otra en la
 * misma rama no son cinco cajas con cuatro flechas, son UNA tarjeta con filas
 * numeradas y su «+ Acción». El grupo NO existe en el contrato (`BusinessFlow`
 * sigue siendo nodos y aristas): se DEDUCE del grafo al dibujar, igual que el
 * layout. Así el flujo viaja al generador exactamente como antes.
 */
export const FLOW_GROUP = {
  width: 240,
  headerHeight: 30,
  rowHeight: 52,
  /** el pie es la fila «+ Acción» */
  footerHeight: 34
} as const

export interface FlowGroup {
  /** El id de la CABEZA: es quien representa a la tarjeta en el grafo condensado. */
  id: string
  /** Las acciones de la tarjeta, en el orden en que se recorren. */
  steps: FlowNode[]
  /** Etiqueta de la rama de la que cuelga la tarjeta ('sí', 'no'), si viene de una decisión. */
  branch?: string
}

export function flowGroupBox(position: NodePosition, rows: number): NodeBox {
  return {
    x: position.x,
    y: position.y,
    width: FLOW_GROUP.width,
    height: FLOW_GROUP.headerHeight + rows * FLOW_GROUP.rowHeight + FLOW_GROUP.footerHeight
  }
}

/**
 * Dos pasos son la misma tarjeta cuando entre ellos no hay ninguna decisión que tomar:
 * el primero tiene UNA sola salida, el segundo UNA sola entrada, y ambos son pasos. En
 * cuanto algo se bifurca o se junta, la cadena se corta —esa flecha sí hay que verla.
 */
export function flowGroups(flow: BusinessFlow): FlowGroup[] {
  const kinds = new Map(flow.nodes.map(node => [node.id, node.kind]))
  const esPaso = (id: string) => kinds.get(id) === 'step'
  const salidas = (id: string) => flow.edges.filter(edge => edge.from === id && edge.to !== id)
  const entradas = (id: string) => flow.edges.filter(edge => edge.to === id && edge.from !== id)

  const siguiente = (id: string): string | null => {
    const propias = salidas(id)
    if (propias.length !== 1) return null
    const destino = propias[0].to
    return esPaso(destino) && entradas(destino).length === 1 ? destino : null
  }

  const continuaciones = new Set(
    flow.nodes
      .filter(node => esPaso(node.id))
      .flatMap(node => (siguiente(node.id) ? [siguiente(node.id) as string] : []))
  )

  const byId = new Map(flow.nodes.map(node => [node.id, node]))
  return flow.nodes
    .filter(node => esPaso(node.id) && !continuaciones.has(node.id))
    .map(head => {
      const steps = [head]
      for (let id = siguiente(head.id); id; id = siguiente(id)) steps.push(byId.get(id) as FlowNode)
      const entrada = entradas(head.id)[0]
      const desdeDecision = entrada && kinds.get(entrada.from) === 'decision' ? entrada.label : undefined
      return { id: head.id, steps, ...(desdeDecision !== undefined ? { branch: desdeDecision } : {}) }
    })
}

/**
 * El grafo que se DIBUJA: cada tarjeta cuenta como un solo vértice (su cabeza), así
 * que las flechas internas de la tarjeta desaparecen del lienzo. Es un `BusinessFlow`
 * corriente para que el layout y las curvas no tengan que saber nada de grupos.
 */
export function flowCondensed(flow: BusinessFlow, groups: FlowGroup[] = flowGroups(flow)): BusinessFlow {
  const representante = new Map<string, string>()
  for (const group of groups) for (const step of group.steps) representante.set(step.id, group.id)
  const cabezas = new Set(groups.map(group => group.id))

  const nodes = flow.nodes.filter(node => node.kind !== 'step' || cabezas.has(node.id))

  const edges: FlowEdge[] = []
  const yaEsta = (candidata: FlowEdge) =>
    edges.some(e => e.from === candidata.from && e.to === candidata.to && e.label === candidata.label)
  for (const edge of flow.edges) {
    const candidata: FlowEdge = {
      from: representante.get(edge.from) ?? edge.from,
      to: representante.get(edge.to) ?? edge.to,
      ...(edge.label !== undefined ? { label: edge.label } : {})
    }
    // el tramo interno de una tarjeta se queda dentro; y nada se apunta a sí mismo
    if (candidata.from === candidata.to || yaEsta(candidata)) continue
    edges.push(candidata)
  }

  return { ...flow, nodes, edges }
}
