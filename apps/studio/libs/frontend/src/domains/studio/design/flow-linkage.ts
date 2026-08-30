import type { BusinessFlow } from '@raptor/schema'

/** Un paso de flujo que ejecuta una transición: la otra punta del botón de la ficha. */
export interface FlowStepLink {
  flowName: string
  stepText: string
}

/**
 * El join de la convergencia (spec 44), visto desde el botón: pasos `step` que declaran
 * la transición `verb` sobre `resource`. Es la MISMA regla con la que el generador da
 * cuerpo real al paso — aquí solo se enseña, nunca se decide nada nuevo con ella.
 */
export function flowStepsForTransition(flows: BusinessFlow[], resource: string, verb: string): FlowStepLink[] {
  return flows.flatMap(flow =>
    flow.nodes
      .filter(node => node.kind === 'step' && node.entity === resource && node.transition === verb)
      .map(node => ({ flowName: flow.name, stepText: node.text }))
  )
}
