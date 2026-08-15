import { describe, expect, it } from 'vitest'
import type { BusinessFlow } from '@raptor/schema'
import { flowToProse } from './flow-prose'

const flujo = (nodes: BusinessFlow['nodes'], edges: BusinessFlow['edges']): BusinessFlow => ({
  name: 'Aviso de stock bajo',
  nodes,
  edges
})

describe('flowToProse', () => {
  it('un flujo recién creado se lee como una frase', () => {
    const prosa = flowToProse(
      flujo(
        [
          { id: 'inicio', kind: 'start', text: 'Inicio' },
          { id: 'fin', kind: 'end', text: 'Fin' }
        ],
        [{ from: 'inicio', to: 'fin' }]
      )
    )

    expect(prosa).toBe('Empieza en «Inicio» y termina en «Fin».')
  })

  it('encadena los pasos en el orden en que se recorren', () => {
    const prosa = flowToProse(
      flujo(
        [
          { id: 'inicio', kind: 'start', text: 'Llega un pedido' },
          { id: 'revisar', kind: 'step', text: 'Revisar stock' },
          { id: 'fin', kind: 'end', text: 'Listo' }
        ],
        [
          { from: 'inicio', to: 'revisar' },
          { from: 'revisar', to: 'fin' }
        ]
      )
    )

    expect(prosa).toContain('Empieza en «Llega un pedido»')
    expect(prosa).toContain('«Revisar stock»')
    expect(prosa).toContain('termina en «Listo»')
  })

  it('una decisión se cuenta con sus dos salidas y sus etiquetas', () => {
    const prosa = flowToProse(
      flujo(
        [
          { id: 'inicio', kind: 'start', text: 'Cambia el stock' },
          { id: 'bajo', kind: 'decision', text: '¿Menos de 10?' },
          { id: 'avisar', kind: 'step', text: 'Avisar a compras' },
          { id: 'fin', kind: 'end', text: 'Nada que hacer' }
        ],
        [
          { from: 'inicio', to: 'bajo' },
          { from: 'bajo', to: 'avisar', label: 'sí' },
          { from: 'bajo', to: 'fin', label: 'no' }
        ]
      )
    )

    expect(prosa).toContain('En «¿Menos de 10?»')
    expect(prosa).toContain('si «sí», «Avisar a compras»')
    expect(prosa).toContain('si «no», «Nada que hacer»')
  })

  it('nombra la entidad del paso cuando la tiene: es el dato que toca', () => {
    const prosa = flowToProse(
      flujo(
        [
          { id: 'inicio', kind: 'start', text: 'Alta' },
          { id: 'crear', kind: 'step', text: 'Crear ficha', entity: 'proveedor' }
        ],
        [{ from: 'inicio', to: 'crear' }]
      )
    )

    expect(prosa).toContain('«Crear ficha» (proveedor)')
  })

  it('un flujo sin inicio lo dice, en vez de inventarse un recorrido', () => {
    const prosa = flowToProse(flujo([{ id: 'suelto', kind: 'step', text: 'Paso suelto' }], []))

    expect(prosa).toContain('sin inicio')
  })
})

describe('flowToProse — lo que no está conectado', () => {
  it('avisa de los nodos que no cuelgan del inicio: callarlos sería mentir por omisión', () => {
    const prosa = flowToProse(
      flujo(
        [
          { id: 'inicio', kind: 'start', text: 'Inicio' },
          { id: 'fin', kind: 'end', text: 'Fin' },
          { id: 'suelto', kind: 'step', text: 'Nuevo paso' }
        ],
        [{ from: 'inicio', to: 'fin' }]
      )
    )

    expect(prosa).toContain('«Nuevo paso»')
    expect(prosa).toContain('sin conectar')
  })

  it('con todo conectado no menciona sueltos', () => {
    const prosa = flowToProse(
      flujo(
        [
          { id: 'inicio', kind: 'start', text: 'Inicio' },
          { id: 'fin', kind: 'end', text: 'Fin' }
        ],
        [{ from: 'inicio', to: 'fin' }]
      )
    )

    expect(prosa).not.toContain('sin conectar')
  })
})
