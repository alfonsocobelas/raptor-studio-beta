import { describe, expect, it } from 'vitest'
import type { BusinessFlow } from '@raptor/schema'
import { flowStepsForTransition } from './flow-linkage'

/**
 * Spec 74 (visibilidad): la unión botón↔flujo es transitiva — ambos referencian la misma
 * transición de la máquina (doctrina idea 9). El join es el mismo que hace el generador
 * al converger: paso con `transition` sobre la entidad del recurso.
 */
describe('flowStepsForTransition — el join que une botón y paso', () => {
  const flows: BusinessFlow[] = [
    {
      name: 'De la captación a la venta',
      nodes: [
        { id: 'inicio', kind: 'start', text: 'El propietario cede el inmueble' },
        { id: 'publicar', kind: 'step', text: 'Se publica y entra en venta', entity: 'inmueble', transition: 'publicar' },
        { id: 'anotar', kind: 'step', text: 'Anotar visita', entity: 'visita' }
      ],
      edges: []
    },
    {
      name: 'Retirada exprés',
      nodes: [
        { id: 'retirar', kind: 'step', text: 'El propietario lo retira', entity: 'inmueble', transition: 'publicar' }
      ],
      edges: []
    }
  ]

  it('devuelve flujo y texto de cada paso que ejecuta el verbo sobre la entidad', () => {
    expect(flowStepsForTransition(flows, 'inmueble', 'publicar')).toEqual([
      { flowName: 'De la captación a la venta', stepText: 'Se publica y entra en venta' },
      { flowName: 'Retirada exprés', stepText: 'El propietario lo retira' }
    ])
  })

  it('un verbo sin coreografía devuelve vacío (también es información)', () => {
    expect(flowStepsForTransition(flows, 'inmueble', 'vender')).toEqual([])
  })

  it('el join respeta la entidad: mismo verbo en otra entidad no cuenta', () => {
    expect(flowStepsForTransition(flows, 'visita', 'publicar')).toEqual([])
  })
})
