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

    expect(prosa).toBe('Inicio y termina con Fin.')
  })

  it('encadena los pasos de un tramo lineal: «entonces» una vez y comas después', () => {
    const prosa = flowToProse(
      flujo(
        [
          { id: 'inicio', kind: 'start', text: 'Llega un pedido' },
          { id: 'revisar', kind: 'step', text: 'Se revisa el stock' },
          { id: 'avisar', kind: 'step', text: 'Se avisa a compras' },
          { id: 'fin', kind: 'end', text: 'Pedido listo' }
        ],
        [
          { from: 'inicio', to: 'revisar' },
          { from: 'revisar', to: 'avisar' },
          { from: 'avisar', to: 'fin' }
        ]
      )
    )

    expect(prosa).toBe('Llega un pedido, entonces se revisa el stock, se avisa a compras y termina con Pedido listo.')
  })

  it('una decisión abre frase propia y numera sus salidas', () => {
    const prosa = flowToProse(
      flujo(
        [
          { id: 'inicio', kind: 'start', text: 'Cambia el stock' },
          { id: 'bajo', kind: 'decision', text: '¿Menos de 10?' },
          { id: 'avisar', kind: 'step', text: 'Se avisa a compras' },
          { id: 'fin', kind: 'end', text: 'Nada que hacer' }
        ],
        [
          { from: 'inicio', to: 'bajo' },
          { from: 'bajo', to: 'avisar', label: 'sí' },
          { from: 'bajo', to: 'fin', label: 'no' }
        ]
      )
    )

    expect(prosa).toBe(
      'Cambia el stock. ¿Menos de 10?: 1. sí, entonces se avisa a compras; 2. no, termina con Nada que hacer.'
    )
  })

  it('cada rama se sigue hasta su final: todos los finales quedan nombrados', () => {
    const prosa = flowToProse(
      flujo(
        [
          { id: 'inicio', kind: 'start', text: 'Llega la solicitud' },
          { id: 'fase', kind: 'decision', text: '¿Fase I o fase II?' },
          { id: 'tramitar', kind: 'step', text: 'La lleva Tramitaciones' },
          { id: 'operar', kind: 'step', text: 'La lleva Operaciones' },
          { id: 'fin-i', kind: 'end', text: 'Cerrada en fase I' },
          { id: 'fin-ii', kind: 'end', text: 'Cerrada en fase II' }
        ],
        [
          { from: 'inicio', to: 'fase' },
          { from: 'fase', to: 'tramitar', label: 'fase I' },
          { from: 'fase', to: 'operar', label: 'fase II' },
          { from: 'tramitar', to: 'fin-i' },
          { from: 'operar', to: 'fin-ii' }
        ]
      )
    )

    expect(prosa).toContain('1. fase I, entonces la lleva Tramitaciones y termina con Cerrada en fase I')
    expect(prosa).toContain('2. fase II, entonces la lleva Operaciones y termina con Cerrada en fase II')
  })

  it('un bucle se cuenta como vuelta a la decisión, sin repetir lo ya contado', () => {
    const prosa = flowToProse(
      flujo(
        [
          { id: 'inicio', kind: 'start', text: 'Llega la muestra' },
          { id: 'limite', kind: 'decision', text: '¿Dentro del límite?' },
          { id: 'validar', kind: 'step', text: 'Se validan los resultados' },
          { id: 'repetir', kind: 'step', text: 'Se repite el análisis' },
          { id: 'fin', kind: 'end', text: 'Muestra cerrada' }
        ],
        [
          { from: 'inicio', to: 'limite' },
          { from: 'limite', to: 'validar', label: 'sí' },
          { from: 'limite', to: 'repetir', label: 'no' },
          { from: 'repetir', to: 'limite' },
          { from: 'validar', to: 'fin' }
        ]
      )
    )

    expect(prosa).toContain('2. no, entonces se repite el análisis y se vuelve a «¿Dentro del límite?»')
    expect(prosa.match(/se repite el análisis/g)).toHaveLength(1)
    expect(prosa.match(/se validan los resultados/g)).toHaveLength(1)
  })

  it('cuando dos ramas convergen, la segunda dice que sigue en lo ya contado', () => {
    const prosa = flowToProse(
      flujo(
        [
          { id: 'inicio', kind: 'start', text: 'Hace falta presentar' },
          { id: 'via', kind: 'decision', text: '¿Por qué vía?' },
          { id: 'email', kind: 'step', text: 'Se presenta por email' },
          { id: 'sede', kind: 'step', text: 'Se presenta en la sede electrónica' },
          { id: 'tramitar', kind: 'step', text: 'Sigue el trámite genérico' },
          { id: 'fin', kind: 'end', text: 'Resuelta' }
        ],
        [
          { from: 'inicio', to: 'via' },
          { from: 'via', to: 'email', label: 'email' },
          { from: 'via', to: 'sede', label: 'sede' },
          { from: 'email', to: 'tramitar' },
          { from: 'sede', to: 'tramitar' },
          { from: 'tramitar', to: 'fin' }
        ]
      )
    )

    expect(prosa).toContain(
      '1. email, entonces se presenta por email, sigue el trámite genérico y termina con Resuelta'
    )
    expect(prosa).toContain(
      '2. sede, entonces se presenta en la sede electrónica y sigue en «Sigue el trámite genérico»'
    )
    expect(prosa.match(/termina con Resuelta/g)).toHaveLength(1)
  })

  it('una decisión detrás de otra: la rama dice a qué decisión llega y esa se cuenta después', () => {
    const prosa = flowToProse(
      flujo(
        [
          { id: 'inicio', kind: 'start', text: 'Llega la solicitud' },
          { id: 'tipo', kind: 'decision', text: '¿Prórroga o nueva?' },
          { id: 'puede', kind: 'decision', text: '¿Se puede prorrogar?' },
          { id: 'abrir', kind: 'step', text: 'Se abre la prórroga' },
          { id: 'fin-nueva', kind: 'end', text: 'Va por licencia nueva' },
          { id: 'fin-no', kind: 'end', text: 'Cancelada' },
          { id: 'fin-si', kind: 'end', text: 'Prórroga abierta' }
        ],
        [
          { from: 'inicio', to: 'tipo' },
          { from: 'tipo', to: 'puede', label: 'prórroga' },
          { from: 'tipo', to: 'fin-nueva', label: 'nueva' },
          { from: 'puede', to: 'abrir', label: 'sí' },
          { from: 'puede', to: 'fin-no', label: 'no' },
          { from: 'abrir', to: 'fin-si' }
        ]
      )
    )

    expect(prosa).toContain('1. prórroga, se llega a «¿Se puede prorrogar?»')
    expect(prosa).toContain(
      '¿Se puede prorrogar?: 1. sí, entonces se abre la prórroga y termina con Prórroga abierta; 2. no, termina con Cancelada.'
    )
  })

  it('un flujo sin inicio lo dice, en vez de inventarse un recorrido', () => {
    const prosa = flowToProse(flujo([{ id: 'suelto', kind: 'step', text: 'Paso suelto' }], []))

    expect(prosa).toContain('sin inicio')
  })
})

describe('flowToProse — cómo se lee el texto de cada nodo', () => {
  it('el final se lee tal cual: es el nombre de un estado, no una cláusula del relato', () => {
    const prosa = flowToProse(
      flujo(
        [
          { id: 'inicio', kind: 'start', text: 'Se envía el enlace' },
          { id: 'fin', kind: 'end', text: 'Sin respuesta de Operaciones' }
        ],
        [{ from: 'inicio', to: 'fin' }]
      )
    )

    expect(prosa).toBe('Se envía el enlace y termina con Sin respuesta de Operaciones.')
  })

  it('cuando el último paso ya lleva su propia «y», el remate se separa con coma', () => {
    const prosa = flowToProse(
      flujo(
        [
          { id: 'inicio', kind: 'start', text: 'Llega la muestra' },
          { id: 'limite', kind: 'decision', text: '¿Dentro del límite?' },
          { id: 'repetir', kind: 'step', text: 'Se marca la desviación y se repite el análisis' },
          { id: 'fin', kind: 'end', text: 'Muestra cerrada' }
        ],
        [
          { from: 'inicio', to: 'limite' },
          { from: 'limite', to: 'fin', label: 'sí' },
          { from: 'limite', to: 'repetir', label: 'no' },
          { from: 'repetir', to: 'limite' }
        ]
      )
    )

    expect(prosa).toContain('2. no, entonces se marca la desviación y se repite el análisis, y se vuelve a')
  })

  it('baja la inicial de las aperturas corrientes cuando el paso cae en medio de la frase', () => {
    const prosa = flowToProse(
      flujo(
        [
          { id: 'inicio', kind: 'start', text: 'Llega el bote' },
          { id: 'registrar', kind: 'step', text: 'Se registra la muestra' },
          { id: 'analizar', kind: 'step', text: 'El técnico la analiza' }
        ],
        [
          { from: 'inicio', to: 'registrar' },
          { from: 'registrar', to: 'analizar' }
        ]
      )
    )

    expect(prosa).toBe('Llega el bote, entonces se registra la muestra, el técnico la analiza.')
  })

  it('respeta la mayúscula cuando la primera palabra no es una apertura corriente: puede ser un nombre propio', () => {
    const prosa = flowToProse(
      flujo(
        [
          { id: 'inicio', kind: 'start', text: 'Llega la solicitud' },
          { id: 'tramita', kind: 'step', text: 'Tramitaciones prepara la prórroga' },
          { id: 'factura', kind: 'step', text: 'Administración factura la muestra' },
          { id: 'avisa', kind: 'step', text: 'OPERACIONES recibe el enlace' }
        ],
        [
          { from: 'inicio', to: 'tramita' },
          { from: 'tramita', to: 'factura' },
          { from: 'factura', to: 'avisa' }
        ]
      )
    )

    expect(prosa).toBe(
      'Llega la solicitud, entonces Tramitaciones prepara la prórroga, Administración factura la muestra, OPERACIONES recibe el enlace.'
    )
  })

  it('no imprime la entidad del paso: eso se ve en el diagrama y en el inspector', () => {
    const prosa = flowToProse(
      flujo(
        [
          { id: 'inicio', kind: 'start', text: 'Alta' },
          { id: 'crear', kind: 'step', text: 'Se crea la ficha', entity: 'proveedor' }
        ],
        [{ from: 'inicio', to: 'crear' }]
      )
    )

    expect(prosa).toBe('Alta, entonces se crea la ficha.')
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
