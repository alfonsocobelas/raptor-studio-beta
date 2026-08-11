import { describe, expect, it } from 'vitest'
import type { BusinessFlow } from '@acc/schema'
import {
  FLOW_DECISION,
  FLOW_GRID,
  FLOW_NODE,
  flowAlternateEdges,
  flowEdgeCurve,
  flowLayout,
  flowNodeBox
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
    // 'stock' es una decisión: el rombo es más pequeño y va centrado en su hueco
    const centradoX = (FLOW_NODE.width - FLOW_DECISION.size) / 2
    const centradoY = (FLOW_NODE.height - FLOW_DECISION.size) / 2
    expect(positions['stock']).toEqual({ x: layerX(1) + centradoX, y: FLOW_GRID.margin + centradoY })
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

// El lienzo CONGELA lo que ya está colocado: editar la topología (borrar un paso,
// meter uno en medio) no puede reordenar lo que el ojo ya tenía situado.
describe('flowLayout — posiciones congeladas', () => {
  it('lo que ya tiene posición se queda EXACTAMENTE donde estaba', () => {
    const congeladas = { inicio: { x: 500, y: 300 }, stock: { x: 720, y: 300 } }

    const positions = flowLayout(pedidoFlow(), 'horizontal', congeladas)

    expect(positions['inicio']).toEqual({ x: 500, y: 300 })
    expect(positions['stock']).toEqual({ x: 720, y: 300 })
  })

  it('borrar un paso no mueve a los demás: sus posiciones congeladas sobreviven', () => {
    const flow = pedidoFlow()
    const congeladas = flowLayout(flow)

    // el gesto real: se borra 'reservar' y el tramo se recose 'stock → fin'
    flow.nodes = flow.nodes.filter(n => n.id !== 'reservar')
    flow.edges = [
      { from: 'inicio', to: 'stock' },
      { from: 'stock', to: 'fin', label: 'sí' },
      { from: 'stock', to: 'pedir', label: 'no' },
      { from: 'pedir', to: 'fin' }
    ]

    const positions = flowLayout(flow, 'horizontal', congeladas)

    // 'fin' estaba en la capa 3 y sigue en su sitio, aunque ahora le tocaría la 2
    expect(positions['fin']).toEqual(congeladas['fin'])
    expect(positions['pedir']).toEqual(congeladas['pedir'])
    expect(positions['reservar']).toBeUndefined()
  })

  it('un nodo NUEVO se coloca por capas, como siempre', () => {
    const flow = pedidoFlow()
    const congeladas = flowLayout(flow)
    flow.nodes = [...flow.nodes, { id: 'avisar', kind: 'step', text: 'avisar al cliente' }]
    flow.edges = [...flow.edges, { from: 'fin', to: 'avisar' }]

    const positions = flowLayout(flow, 'horizontal', congeladas)

    expect(positions['avisar']).toEqual({ x: FLOW_GRID.margin + 4 * FLOW_GRID.colWidth, y: FLOW_GRID.margin })
  })

  it('un nodo nuevo no aterriza ENCIMA de uno congelado: baja una fila hasta encontrar sitio', () => {
    const flow = pedidoFlow()
    flow.nodes = [...flow.nodes, { id: 'avisar', kind: 'step', text: 'avisar al cliente' }]
    flow.edges = [...flow.edges, { from: 'fin', to: 'avisar' }]
    // alguien arrastró 'fin' justo al hueco que le toca al nodo nuevo
    const congeladas = { fin: { x: FLOW_GRID.margin + 4 * FLOW_GRID.colWidth, y: FLOW_GRID.margin } }

    const positions = flowLayout(flow, 'horizontal', congeladas)

    expect(positions['avisar']).toEqual({
      x: FLOW_GRID.margin + 4 * FLOW_GRID.colWidth,
      y: FLOW_GRID.margin + FLOW_GRID.rowHeight
    })
  })

  it('sin posiciones congeladas se comporta como siempre', () => {
    expect(flowLayout(pedidoFlow(), 'horizontal', {})).toEqual(flowLayout(pedidoFlow()))
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

  it('la decisión es CUADRADA: un rombo alargado no se lee como rombo', () => {
    expect(flowNodeBox({ x: 100, y: 60 }, 'decision')).toEqual({
      x: 100,
      y: 60,
      width: FLOW_DECISION.size,
      height: FLOW_DECISION.size
    })
  })
})

describe('flowLayout — el rombo comparte carril con los pasos', () => {
  it('centra la decisión en su fila: la flecha entra y sale plana, sin subir y bajar', () => {
    const positions = flowLayout(pedidoFlow())
    const paso = flowNodeBox(positions['inicio'])
    const rombo = flowNodeBox(positions['stock'], 'decision')

    // los vértices izquierdo y derecho del rombo caen a la altura por la que entra la flecha
    expect(rombo.y + rombo.height / 2).toBe(paso.y + paso.height / 2)
  })

  it('una posición congelada manda sobre el centrado: lo arrastrado no se recoloca', () => {
    const positions = flowLayout(pedidoFlow(), 'horizontal', { stock: { x: 700, y: 400 } })

    expect(positions['stock']).toEqual({ x: 700, y: 400 })
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

describe('orientación del flujo', () => {
  it('en vertical la capa baja y las ramas se reparten a lo ancho', () => {
    const positions = flowLayout(pedidoFlow(), 'vertical')

    const capaY = (depth: number) => FLOW_GRID.margin + depth * FLOW_GRID.rowHeight
    expect(positions['inicio']).toEqual({ x: FLOW_GRID.margin, y: capaY(0) })
    // la decisión va centrada en su hueco, también leyendo el proceso en columna
    expect(positions['stock']).toEqual({
      x: FLOW_GRID.margin + (FLOW_NODE.width - FLOW_DECISION.size) / 2,
      y: capaY(1) + (FLOW_NODE.height - FLOW_DECISION.size) / 2
    })
    expect(positions['pedir']).toEqual({ x: FLOW_GRID.margin, y: capaY(2) })
    expect(positions['reservar']).toEqual({ x: FLOW_GRID.margin + FLOW_GRID.colWidth, y: capaY(2) })
  })

  it('horizontal sigue siendo el valor por defecto', () => {
    expect(flowLayout(pedidoFlow())).toEqual(flowLayout(pedidoFlow(), 'horizontal'))
  })

  it('la curva vertical sale por el pie y entra por la cabeza', () => {
    const arriba: NodeBox = { x: 40, y: 40, width: 180, height: 56 }
    const abajo: NodeBox = { x: 40, y: 240, width: 180, height: 56 }

    const curva = flowEdgeCurve(arriba, abajo, 'vertical')

    expect(curva.y1).toBe(arriba.y + arriba.height)
    expect(curva.y2).toBe(abajo.y)
    expect(curva.x1).toBe(arriba.x + arriba.width / 2)
  })
})
