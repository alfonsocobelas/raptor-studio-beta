import type { BusinessFlow } from '@acc/schema'
import { flowProcessNames, flowStepMethods } from './flow-process'

/**
 * Spec 39, TASK-02: derivación de nombres del proceso emitido. Toda la lógica vive
 * aquí (regla 8): la plantilla solo interpolará estos valores. El flujo NO se ejecuta
 * (regla 7): solo los nodos `step` derivan método; start/end/decision son documentación.
 */
describe('flow-process — derivación de nombres (spec 39)', () => {
  const flow: BusinessFlow = {
    name: 'De presupuesto a legalización',
    nodes: [
      { id: 'llega-obra', kind: 'start', text: 'Llega una obra' },
      { id: 'presupuesto', kind: 'step', text: 'Se solicita presupuesto', entity: 'instalacion' },
      { id: 'aprueba', kind: 'decision', text: '¿Aprueba el cliente?' },
      { id: 'planifica-montaje', kind: 'step', text: 'Se planifica el montaje', entity: 'instalacion' },
      { id: 'fin', kind: 'end', text: 'Instalación legalizada' }
    ],
    edges: [
      { from: 'llega-obra', to: 'presupuesto' },
      { from: 'presupuesto', to: 'aprueba' },
      { from: 'aprueba', to: 'planifica-montaje', label: 'sí' },
      { from: 'planifica-montaje', to: 'fin' }
    ]
  }

  it('deriva carpeta/fichero en kebab sin acentos y clase PascalCase con sufijo Process', () => {
    // WHEN
    const derived = flowProcessNames(flow)

    // THEN
    expect(derived.fileName).toBe('de-presupuesto-a-legalizacion')
    expect(derived.className).toBe('DePresupuestoALegalizacionProcess')
  })

  it('solo los nodos step derivan método, en orden BFS y con nombre camelCase', () => {
    // WHEN
    const methods = flowStepMethods(flow)

    // THEN: ni start, ni decision, ni end — y 'planifica-montaje' → 'planificaMontaje'
    expect(methods.map(m => m.methodName)).toEqual(['presupuesto', 'planificaMontaje'])
    expect(methods.map(m => m.node.id)).toEqual(['presupuesto', 'planifica-montaje'])
  })

  it('un flujo sin nodos step no deriva ningún método', () => {
    // GIVEN
    const empty: BusinessFlow = {
      name: 'Solo documental',
      nodes: [
        { id: 'a', kind: 'start', text: 'Inicio' },
        { id: 'b', kind: 'end', text: 'Fin' }
      ],
      edges: [{ from: 'a', to: 'b' }]
    }

    // WHEN / THEN
    expect(flowStepMethods(empty)).toEqual([])
  })
})
