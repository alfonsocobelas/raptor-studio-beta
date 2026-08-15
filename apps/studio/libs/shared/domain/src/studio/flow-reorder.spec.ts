import { describe, expect, it } from 'vitest'
import type { BusinessFlow } from '@raptor/schema'
import { flowGroups } from './flow-groups'
import { reorderFlowStep } from './flow-reorder'

// El orden de las acciones NO es un array: es la cadena de flechas de la tarjeta. Reordenar
// es recablear esa cadena, y solo esa: la entrada a la cabeza (con su rama), los tramos
// internos y la salida de la cola. Lo demás del grafo se queda como estaba.

const conRamas = (): BusinessFlow => ({
  name: 'Cambia el stock',
  nodes: [
    { id: 'disparador', kind: 'start', text: 'Cambia el stock' },
    { id: 'bajo', kind: 'decision', text: 'stock < 10' },
    { id: 'marcar', kind: 'step', text: 'Marcar la fila en naranja' },
    { id: 'correo', kind: 'step', text: 'Enviar correo' },
    { id: 'cerrar', kind: 'step', text: 'Cerrar el aviso' },
    { id: 'quitar', kind: 'step', text: 'Quitar el aviso' },
    { id: 'fin', kind: 'end', text: 'Listo' }
  ],
  edges: [
    { from: 'disparador', to: 'bajo' },
    { from: 'bajo', to: 'marcar', label: 'sí' },
    { from: 'marcar', to: 'correo' },
    { from: 'correo', to: 'cerrar' },
    { from: 'cerrar', to: 'fin' },
    { from: 'bajo', to: 'quitar', label: 'no' },
    { from: 'quitar', to: 'fin' }
  ]
})

/** Lo que se lee en la tarjeta: sus filas, de arriba abajo. */
function filas(flow: BusinessFlow, head: string): string[] {
  const group = flowGroups(flow).find(g => g.steps.some(step => step.id === head))
  return group ? group.steps.map(step => step.id) : []
}

describe('reorderFlowStep — recablear la cadena de una tarjeta', () => {
  it('mueve una acción al medio de su tarjeta', () => {
    const reordenado = reorderFlowStep(conRamas(), 'cerrar', 1)

    expect(filas(reordenado, 'marcar')).toEqual(['marcar', 'cerrar', 'correo'])
  })

  it('mover la acción a la cabeza arrastra la entrada CON su rama', () => {
    const reordenado = reorderFlowStep(conRamas(), 'cerrar', 0)

    expect(filas(reordenado, 'cerrar')).toEqual(['cerrar', 'marcar', 'correo'])
    // la tarjeta sigue colgando del «sí» de la decisión, ahora por su nueva cabeza
    expect(reordenado.edges).toContainEqual({ from: 'bajo', to: 'cerrar', label: 'sí' })
    expect(reordenado.edges).not.toContainEqual({ from: 'bajo', to: 'marcar', label: 'sí' })
  })

  it('mover la acción a la cola traslada la salida al nuevo último paso', () => {
    const reordenado = reorderFlowStep(conRamas(), 'marcar', 2)

    expect(filas(reordenado, 'correo')).toEqual(['correo', 'cerrar', 'marcar'])
    expect(reordenado.edges).toContainEqual({ from: 'marcar', to: 'fin' })
    expect(reordenado.edges).not.toContainEqual({ from: 'cerrar', to: 'fin' })
  })

  it('la otra rama y el resto del grafo no se tocan', () => {
    const original = conRamas()
    const reordenado = reorderFlowStep(original, 'cerrar', 0)

    expect(reordenado.nodes).toEqual(original.nodes)
    expect(reordenado.edges).toHaveLength(original.edges.length)
    for (const ajena of [
      { from: 'disparador', to: 'bajo' },
      { from: 'bajo', to: 'quitar', label: 'no' },
      { from: 'quitar', to: 'fin' }
    ]) {
      expect(reordenado.edges).toContainEqual(ajena)
    }
  })

  it('dejar la acción donde estaba no cambia el flujo: es el MISMO objeto', () => {
    const original = conRamas()

    expect(reorderFlowStep(original, 'correo', 1)).toBe(original)
  })

  it('el índice se recorta al rango de la tarjeta: no hay forma de salirse', () => {
    expect(filas(reorderFlowStep(conRamas(), 'marcar', 9), 'correo')).toEqual(['correo', 'cerrar', 'marcar'])
    expect(filas(reorderFlowStep(conRamas(), 'cerrar', -3), 'cerrar')).toEqual(['cerrar', 'marcar', 'correo'])
  })

  it('una tarjeta de una sola fila no tiene nada que reordenar', () => {
    const original = conRamas()

    expect(reorderFlowStep(original, 'quitar', 0)).toBe(original)
  })

  it('un id que no es una acción del flujo se ignora', () => {
    const original = conRamas()

    expect(reorderFlowStep(original, 'bajo', 0)).toBe(original)
    expect(reorderFlowStep(original, 'no-existe', 0)).toBe(original)
  })

  it('la primera acción del flujo conserva su entrada sin rama al reordenar', () => {
    const seguidas: BusinessFlow = {
      name: 'Alta',
      nodes: [
        { id: 'inicio', kind: 'start', text: 'Alta' },
        { id: 'uno', kind: 'step', text: 'Uno' },
        { id: 'dos', kind: 'step', text: 'Dos' },
        { id: 'fin', kind: 'end', text: 'Listo' }
      ],
      edges: [
        { from: 'inicio', to: 'uno' },
        { from: 'uno', to: 'dos' },
        { from: 'dos', to: 'fin' }
      ]
    }

    const reordenado = reorderFlowStep(seguidas, 'dos', 0)

    expect(filas(reordenado, 'dos')).toEqual(['dos', 'uno'])
    expect(reordenado.edges).toContainEqual({ from: 'inicio', to: 'dos' })
    expect(reordenado.edges).toContainEqual({ from: 'dos', to: 'uno' })
    expect(reordenado.edges).toContainEqual({ from: 'uno', to: 'fin' })
    // sin rama de por medio, la arista de entrada NO se inventa etiqueta
    expect(reordenado.edges.find(edge => edge.from === 'inicio')).not.toHaveProperty('label')
  })
})
