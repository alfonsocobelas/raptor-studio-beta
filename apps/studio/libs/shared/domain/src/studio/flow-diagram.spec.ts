import { describe, expect, it } from 'vitest'
import type { BusinessFlow } from '@acc/schema'
import {
  FLOW_GRID,
  FLOW_NODE,
  flowAlternateEdges,
  flowEdgeCurve,
  flowLayout,
  flowNodeBox,
  flowStepNumbers
} from './flow-diagram'
import type { NodeBox } from './model-diagram'

const pedidoFlow = (): BusinessFlow => ({
  name: 'Alta de pedido',
  nodes: [
    { id: 'inicio', kind: 'start', text: 'llega un pedido' },
    { id: 'stock', kind: 'decision', text: '¿hay stock?' },
    { id: 'reservar', kind: 'step', text: 'reservar stock' },
    { id: 'pedir', kind: 'step', text: 'pedir al proveedor' },
    { id: 'fin', kind: 'end', text: 'pedido tramitado' }
  ],
  edges: [
    { from: 'inicio', to: 'stock' },
    { from: 'stock', to: 'reservar', label: 'sí' },
    { from: 'stock', to: 'pedir', label: 'no' },
    { from: 'reservar', to: 'fin' },
    { from: 'pedir', to: 'fin' }
  ]
})

describe('flowLayout — capas BFS desde el start', () => {
  it('el proceso avanza en HORIZONTAL: la capa es la columna (x) y el orden dentro de ella la fila (y)', () => {
    const positions = flowLayout(pedidoFlow())

    const layerX = (depth: number) => FLOW_GRID.margin + depth * FLOW_GRID.colWidth
    expect(positions['inicio']).toEqual({ x: layerX(0), y: FLOW_GRID.margin })
    expect(positions['stock']).toEqual({ x: layerX(1), y: FLOW_GRID.margin })
    // capa 2: 'pedir' < 'reservar' alfabéticamente, así que 'pedir' va arriba
    expect(positions['pedir']).toEqual({ x: layerX(2), y: FLOW_GRID.margin })
    expect(positions['reservar']).toEqual({ x: layerX(2), y: FLOW_GRID.margin + FLOW_GRID.rowHeight })
    expect(positions['fin']).toEqual({ x: layerX(3), y: FLOW_GRID.margin })
  })

  it('es determinista: el mismo flujo produce las mismas posiciones', () => {
    expect(flowLayout(pedidoFlow())).toEqual(flowLayout(pedidoFlow()))
  })

  it('un ciclo entre nodos no lo cuelga: cada nodo queda en su primera capa alcanzada', () => {
    const flow: BusinessFlow = {
      name: 'Con reintento',
      nodes: [
        { id: 'inicio', kind: 'start', text: 'llega solicitud' },
        { id: 'revisar', kind: 'step', text: 'revisar' },
        { id: 'valida', kind: 'decision', text: '¿válida?' },
        { id: 'subsanar', kind: 'step', text: 'subsanar' },
        { id: 'fin', kind: 'end', text: 'aprobada' }
      ],
      edges: [
        { from: 'inicio', to: 'revisar' },
        { from: 'revisar', to: 'valida' },
        { from: 'valida', to: 'fin', label: 'sí' },
        { from: 'valida', to: 'subsanar', label: 'no' },
        { from: 'subsanar', to: 'revisar' }
      ]
    }

    const positions = flowLayout(flow)

    expect(Object.keys(positions)).toHaveLength(5)
    // 'revisar' está en la capa 1: primera columna tras el inicio
    expect(positions['revisar'].x).toBe(FLOW_GRID.margin + FLOW_GRID.colWidth)
  })

  it('un nodo inalcanzable no desaparece: cae en una capa extra al final (defensivo)', () => {
    const flow = pedidoFlow()
    flow.nodes = [...flow.nodes, { id: 'isla', kind: 'step', text: 'aislado' }]

    const positions = flowLayout(flow)

    expect(positions['isla']).toEqual({ x: FLOW_GRID.margin + 4 * FLOW_GRID.colWidth, y: FLOW_GRID.margin })
  })

  it('sin nodo start devuelve un layout vacío (el gate ya lo habrá rechazado)', () => {
    const flow = pedidoFlow()
    flow.nodes = flow.nodes.filter(n => n.kind !== 'start')

    expect(flowLayout(flow)).toEqual({})
  })
})

describe('flowNodeBox — la caja de un nodo de flujo', () => {
  it('devuelve la caja con las dimensiones fijas del nodo de flujo', () => {
    expect(flowNodeBox({ x: 100, y: 60 })).toEqual({
      x: 100,
      y: 60,
      width: FLOW_NODE.width,
      height: FLOW_NODE.height
    })
  })
})

describe('flowEdgeCurve — el flujo avanza a la derecha, así que la curva es horizontal', () => {
  const izquierda: NodeBox = { x: 40, y: 100, width: 180, height: 56 }
  const derecha: NodeBox = { x: 300, y: 240, width: 180, height: 56 }

  it('sale por el costado derecho del origen y entra por el izquierdo del destino', () => {
    const curva = flowEdgeCurve(izquierda, derecha)

    expect(curva.x1).toBe(izquierda.x + izquierda.width)
    expect(curva.y1).toBe(izquierda.y + izquierda.height / 2)
    expect(curva.x2).toBe(derecha.x)
    expect(curva.y2).toBe(derecha.y + derecha.height / 2)
  })

  it('cuando el destino queda a la izquierda (un bucle atrás), se invierten los lados', () => {
    const curva = flowEdgeCurve(derecha, izquierda)

    expect(curva.x1).toBe(derecha.x)
    expect(curva.x2).toBe(izquierda.x + izquierda.width)
  })

  it('los tiradores van en horizontal: la curva sale y entra plana', () => {
    const curva = flowEdgeCurve(izquierda, derecha)
    const [, cy1, , cy2] = curva.d.split('C')[1].trim().split(/[ ,]+/).map(Number)

    expect(cy1).toBe(curva.y1)
    expect(cy2).toBe(curva.y2)
  })

  it('la etiqueta va en el medio del trazo', () => {
    const curva = flowEdgeCurve(izquierda, derecha)

    expect(curva.labelX).toBeGreaterThan(curva.x1)
    expect(curva.labelX).toBeLessThan(curva.x2)
  })
})

describe('flowStepNumbers — los pasos se numeran por el orden del recorrido', () => {
  it('numera solo los pasos: el inicio, la decisión y el fin no llevan número', () => {
    const flow = {
      name: 'F',
      nodes: [
        { id: 'inicio', kind: 'start' as const, text: 'Inicio' },
        { id: 'uno', kind: 'step' as const, text: 'Uno' },
        { id: 'dec', kind: 'decision' as const, text: '¿Sí?' },
        { id: 'dos', kind: 'step' as const, text: 'Dos' },
        { id: 'fin', kind: 'end' as const, text: 'Fin' }
      ],
      edges: [
        { from: 'inicio', to: 'uno' },
        { from: 'uno', to: 'dec' },
        { from: 'dec', to: 'dos', label: 'sí' },
        { from: 'dos', to: 'fin' }
      ]
    }

    const numeros = flowStepNumbers(flow)

    expect(numeros).toEqual({ uno: 1, dos: 2 })
  })

  it('un paso suelto también se numera, al final: existe en el lienzo', () => {
    const flow = {
      name: 'F',
      nodes: [
        { id: 'inicio', kind: 'start' as const, text: 'Inicio' },
        { id: 'conectado', kind: 'step' as const, text: 'Conectado' },
        { id: 'suelto', kind: 'step' as const, text: 'Suelto' }
      ],
      edges: [{ from: 'inicio', to: 'conectado' }]
    }

    expect(flowStepNumbers(flow)).toEqual({ conectado: 1, suelto: 2 })
  })
})

describe('flowAlternateEdges — la salida alternativa de una decisión', () => {
  it('la primera salida de la decisión es la principal; las demás son alternativas', () => {
    const flow: BusinessFlow = {
      name: 'F',
      nodes: [
        { id: 'inicio', kind: 'start', text: 'Inicio' },
        { id: 'dec', kind: 'decision', text: '¿Sí?' },
        { id: 'a', kind: 'step', text: 'A' },
        { id: 'b', kind: 'step', text: 'B' }
      ],
      edges: [
        { from: 'inicio', to: 'dec' },
        { from: 'dec', to: 'a', label: 'sí' },
        { from: 'dec', to: 'b', label: 'no' }
      ]
    }

    const alternativas = flowAlternateEdges(flow)

    expect(alternativas.has('dec→b')).toBe(true)
    expect(alternativas.has('dec→a')).toBe(false)
    expect(alternativas.has('inicio→dec')).toBe(false)
  })

  it('las salidas de un paso normal nunca son alternativas: no bifurcan por decisión', () => {
    const flow: BusinessFlow = {
      name: 'F',
      nodes: [
        { id: 'inicio', kind: 'start', text: 'Inicio' },
        { id: 'paso', kind: 'step', text: 'Paso' },
        { id: 'a', kind: 'step', text: 'A' },
        { id: 'b', kind: 'step', text: 'B' }
      ],
      edges: [
        { from: 'inicio', to: 'paso' },
        { from: 'paso', to: 'a' },
        { from: 'paso', to: 'b' }
      ]
    }

    expect(flowAlternateEdges(flow).size).toBe(0)
  })
})
