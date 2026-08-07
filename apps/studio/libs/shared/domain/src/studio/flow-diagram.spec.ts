import { describe, expect, it } from 'vitest'
import type { BusinessFlow } from '@acc/schema'
import { FLOW_GRID, FLOW_NODE, flowLayout, flowNodeBox } from './flow-diagram'

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
  it('coloca cada nodo en la capa de su distancia al start (y) en orden por id (x)', () => {
    const positions = flowLayout(pedidoFlow())

    const layerY = (depth: number) => FLOW_GRID.margin + depth * FLOW_GRID.rowHeight
    expect(positions['inicio']).toEqual({ x: FLOW_GRID.margin, y: layerY(0) })
    expect(positions['stock']).toEqual({ x: FLOW_GRID.margin, y: layerY(1) })
    // capa 2: 'pedir' < 'reservar' alfabéticamente
    expect(positions['pedir']).toEqual({ x: FLOW_GRID.margin, y: layerY(2) })
    expect(positions['reservar']).toEqual({ x: FLOW_GRID.margin + FLOW_GRID.colWidth, y: layerY(2) })
    expect(positions['fin']).toEqual({ x: FLOW_GRID.margin, y: layerY(3) })
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
    expect(positions['revisar'].y).toBe(FLOW_GRID.margin + FLOW_GRID.rowHeight)
  })

  it('un nodo inalcanzable no desaparece: cae en una capa extra al final (defensivo)', () => {
    const flow = pedidoFlow()
    flow.nodes = [...flow.nodes, { id: 'isla', kind: 'step', text: 'aislado' }]

    const positions = flowLayout(flow)

    expect(positions['isla']).toEqual({ x: FLOW_GRID.margin, y: FLOW_GRID.margin + 4 * FLOW_GRID.rowHeight })
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
