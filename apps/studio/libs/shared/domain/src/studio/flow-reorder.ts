import type { BusinessFlow, FlowEdge } from '@raptor/schema'
import { flowGroups } from './flow-groups'

/**
 * REORDENAR LAS ACCIONES de una tarjeta (spec 40). El orden no es un array ni un campo
 * `order`: es la CADENA DE FLECHAS que `flowGroups` recorre. Reordenar, por tanto, es
 * recablear esa cadena —y solo esa—: la flecha que entra en la cabeza (con su etiqueta de
 * rama, si viene de una condición), los tramos internos y la que sale de la cola. El resto
 * del grafo se copia tal cual, así que el contrato `BusinessFlow` no cambia y el flujo viaja
 * al generador exactamente como antes.
 *
 *   antes:   X ─(sí)→ [A → B → C] → Y        mover C a la cabeza
 *   después: X ─(sí)→ [C → A → B] → Y
 */
export function reorderFlowStep(flow: BusinessFlow, stepId: string, toIndex: number): BusinessFlow {
  const group = flowGroups(flow).find(candidate => candidate.steps.some(step => step.id === stepId))
  if (!group || group.steps.length < 2) return flow

  const orden = group.steps.map(step => step.id)
  const desde = orden.indexOf(stepId)
  const hasta = Math.min(Math.max(toIndex, 0), orden.length - 1)
  if (desde === hasta) return flow

  const nuevo = [...orden]
  nuevo.splice(desde, 1)
  nuevo.splice(hasta, 0, stepId)

  const interna = (edge: FlowEdge) => orden.includes(edge.from) && orden.includes(edge.to)
  const entrada = flow.edges.find(edge => edge.to === orden[0] && !orden.includes(edge.from))
  const salida = flow.edges.find(edge => edge.from === orden[orden.length - 1] && !orden.includes(edge.to))

  const edges = flow.edges.map(edge => {
    // la entrada apunta a la nueva cabeza, conservando su etiqueta de rama
    if (edge === entrada) return { ...edge, to: nuevo[0] }
    // y la salida arranca de la nueva cola
    if (edge === salida) return { ...edge, from: nuevo[nuevo.length - 1] }
    return edge
  })

  // los tramos internos se REESCRIBEN en bloque, por posición: son tantos como antes, así
  // que el número de aristas del flujo no cambia y nada queda huérfano
  const tramos = nuevo.slice(0, -1).map((from, i) => ({ from, to: nuevo[i + 1] }))
  let siguiente = 0
  return {
    ...flow,
    edges: edges.map(edge => (interna(edge) ? tramos[siguiente++] : edge))
  }
}
