import { describe, expect, it } from 'vitest'
import type { StateMachine } from '@raptor/schema'
import { STATE_NODE, stateDiagram } from './state-diagram'

/**
 * Spec 43: el dibujo de la máquina es una PROYECCIÓN pura del par (enum, máquina) — misma
 * doctrina que model-diagram y flow-diagram: el layout se calcula, nunca se almacena.
 */
describe('stateDiagram', () => {
  const values = [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'aprobada', label: 'Aprobada' },
    { value: 'cerrada', label: 'Cerrada' }
  ]

  const machine: StateMachine = {
    field: 'estado',
    initial: 'pendiente',
    transitions: [
      { name: 'aprobar', label: 'Aprobar', from: ['pendiente'], to: 'aprobada' },
      { name: 'cerrar', label: 'Cerrar', from: ['aprobada'], to: 'cerrada' },
      { name: 'reabrir', label: 'Reabrir', from: ['cerrada'], to: 'pendiente' }
    ]
  }

  it('un nodo por valor del enum, en su orden y con su label humano', () => {
    const diagram = stateDiagram(machine, values)

    expect(diagram.nodes.map(n => n.value)).toEqual(['pendiente', 'aprobada', 'cerrada'])
    expect(diagram.nodes.map(n => n.label)).toEqual(['Pendiente', 'Aprobada', 'Cerrada'])
    // fila horizontal: cada nodo empieza donde el anterior terminó más el hueco
    expect(diagram.nodes[1].x).toBeGreaterThan(diagram.nodes[0].x + STATE_NODE.width)
  })

  it('el inicial queda marcado; los alcanzables no llevan aviso', () => {
    const diagram = stateDiagram(machine, values)

    expect(diagram.nodes.find(n => n.value === 'pendiente')?.initial).toBe(true)
    expect(diagram.nodes.every(n => !n.unreachable)).toBe(true)
  })

  it('un valor al que nada llega queda señalado como suelto', () => {
    const diagram = stateDiagram({ ...machine, transitions: [machine.transitions[0]] }, values)

    expect(diagram.nodes.find(n => n.value === 'cerrada')?.unreachable).toBe(true)
  })

  it('una transición con varios orígenes se dibuja como una flecha por origen', () => {
    const twoOrigins: StateMachine = {
      ...machine,
      transitions: [{ name: 'descartar', label: 'Descartar', from: ['pendiente', 'aprobada'], to: 'cerrada' }]
    }

    const diagram = stateDiagram(twoOrigins, values)

    expect(diagram.edges.map(e => e.key)).toEqual(['descartar:pendiente', 'descartar:aprobada'])
    expect(diagram.edges.every(e => e.label === 'Descartar')).toBe(true)
  })

  it('toda flecha lleva un path que empieza en su origen real', () => {
    const diagram = stateDiagram(machine, values)

    for (const edge of diagram.edges) {
      expect(edge.path.startsWith('M ')).toBe(true)
      expect(diagram.nodes.some(n => n.value === edge.from)).toBe(true)
      expect(diagram.nodes.some(n => n.value === edge.to)).toBe(true)
    }
  })

  it('el lienzo abarca todos los nodos', () => {
    const diagram = stateDiagram(machine, values)
    const last = diagram.nodes[diagram.nodes.length - 1]

    expect(diagram.width).toBeGreaterThanOrEqual(last.x + STATE_NODE.width)
    expect(diagram.height).toBeGreaterThan(STATE_NODE.height)
  })
})
