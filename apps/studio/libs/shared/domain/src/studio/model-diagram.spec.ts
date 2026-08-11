import { describe, expect, it } from 'vitest'
import type { DraftResource } from './draft-resource'
import {
  autoLayout,
  edgeCurve,
  edgeLine,
  modelEdges,
  nodeAt,
  nodeBox,
  overlayLayout,
  MODEL_GRID,
  MODEL_NODE,
  type NodeBox
} from './model-diagram'

const entity = (name: string, fields: DraftResource['fields'] = []): DraftResource => ({
  name,
  plural: `${name}s`,
  labelSingular: name.charAt(0).toUpperCase() + name.slice(1),
  labelPlural: `${name.charAt(0).toUpperCase() + name.slice(1)}s`,
  gender: 'm',
  fields: [{ name: 'nombre', label: 'Nombre', type: 'string' }, ...fields]
})

describe('modelEdges', () => {
  it('deriva una arista por cada campo ref con destino', () => {
    const resources = [
      entity('paciente', [{ name: 'dueno', label: 'Dueño', type: 'ref', refTo: 'dueno' }]),
      entity('dueno'),
      entity('cita', [{ name: 'paciente', label: 'Paciente', type: 'ref', refTo: 'paciente' }])
    ]

    expect(modelEdges(resources)).toEqual([
      { from: 'paciente', to: 'dueno', fieldIndex: 1, label: 'Dueño' },
      { from: 'cita', to: 'paciente', fieldIndex: 1, label: 'Paciente' }
    ])
  })

  it('ignora los campos no-ref y las ref sin destino', () => {
    const resources = [entity('cita', [{ name: 'paciente', label: 'Paciente', type: 'ref' }])]

    expect(modelEdges(resources)).toEqual([])
  })

  it('dos refs de la misma entidad al mismo destino son dos aristas', () => {
    const resources = [
      entity('cita', [
        { name: 'paciente', label: 'Paciente', type: 'ref', refTo: 'paciente' },
        { name: 'paciente2', label: 'Paciente 2', type: 'ref', refTo: 'paciente' }
      ]),
      entity('paciente')
    ]

    expect(modelEdges(resources)).toHaveLength(2)
  })
})

describe('autoLayout', () => {
  it('es determinista: mismas entidades, mismas posiciones', () => {
    const names = ['paciente', 'dueno', 'cita']

    expect(autoLayout(names)).toEqual(autoLayout(names))
  })

  it('coloca en rejilla de 3 columnas sin solapar', () => {
    const positions = autoLayout(['a', 'b', 'c', 'd'])

    expect(positions['a']).toEqual({ x: MODEL_GRID.margin, y: MODEL_GRID.margin })
    expect(positions['b'].x).toBe(MODEL_GRID.margin + MODEL_GRID.colWidth)
    expect(positions['b'].y).toBe(MODEL_GRID.margin)
    // la cuarta caja abre la segunda fila
    expect(positions['d']).toEqual({ x: MODEL_GRID.margin, y: MODEL_GRID.margin + MODEL_GRID.rowHeight })
    const keys = Object.values(positions).map(p => `${p.x},${p.y}`)
    expect(new Set(keys).size).toBe(4)
  })
})

describe('overlayLayout — lo arrastrado gana al auto-layout', () => {
  it('una posición manual sustituye a la calculada; el resto se conserva', () => {
    const auto = autoLayout(['a', 'b'])

    const merged = overlayLayout(auto, { a: { x: 500, y: 120 } })

    expect(merged['a']).toEqual({ x: 500, y: 120 })
    expect(merged['b']).toEqual(auto['b'])
  })

  it('ignora posiciones manuales de entidades que ya no existen', () => {
    const auto = autoLayout(['a'])

    const merged = overlayLayout(auto, { borrada: { x: 10, y: 10 } })

    expect(merged).toEqual(auto)
  })

  it('recorta a coordenadas no negativas: no se puede sacar una caja del lienzo', () => {
    const auto = autoLayout(['a'])

    const merged = overlayLayout(auto, { a: { x: -30, y: -5 } })

    expect(merged['a']).toEqual({ x: 0, y: 0 })
  })
})

describe('nodeBox', () => {
  it('el alto crece con los campos: cabecera + una fila por campo', () => {
    const box = nodeBox({ x: 40, y: 40 }, 3)

    expect(box).toEqual({
      x: 40,
      y: 40,
      width: MODEL_NODE.width,
      height: MODEL_NODE.headerHeight + 3 * MODEL_NODE.rowHeight
    })
  })

  it('una entidad sin campos conserva al menos la cabecera', () => {
    const box = nodeBox({ x: 0, y: 0 }, 0)

    expect(box.height).toBe(MODEL_NODE.headerHeight)
  })
})

describe('nodeAt — sobre qué caja se suelta el puntero', () => {
  const boxes: Record<string, NodeBox> = {
    cita: { x: 0, y: 0, width: 100, height: 60 },
    paciente: { x: 200, y: 0, width: 100, height: 60 }
  }

  it('devuelve la caja que contiene el punto (bordes incluidos)', () => {
    expect(nodeAt({ x: 50, y: 30 }, boxes)).toBe('cita')
    expect(nodeAt({ x: 200, y: 0 }, boxes)).toBe('paciente')
    expect(nodeAt({ x: 300, y: 60 }, boxes)).toBe('paciente')
  })

  it('devuelve null si el punto cae en el vacío', () => {
    expect(nodeAt({ x: 150, y: 30 }, boxes)).toBeNull()
    expect(nodeAt({ x: 50, y: 500 }, boxes)).toBeNull()
  })
})

describe('edgeLine', () => {
  const box = (x: number, y: number): NodeBox => ({ x, y, width: 100, height: 60 })

  it('entre cajas en horizontal une el borde derecho con el izquierdo', () => {
    const line = edgeLine(box(0, 0), box(300, 0))

    expect(line).toEqual({ x1: 100, y1: 30, x2: 300, y2: 30 })
  })

  it('entre cajas en vertical une el borde inferior con el superior', () => {
    const line = edgeLine(box(0, 0), box(0, 300))

    expect(line).toEqual({ x1: 50, y1: 60, x2: 50, y2: 300 })
  })

  it('en diagonal la línea nace y muere en el perímetro, no en el centro', () => {
    const from = box(0, 0)
    const to = box(300, 300)
    const line = edgeLine(from, to)

    // arranca dentro del perímetro de origen…
    expect(line.x1).toBeGreaterThanOrEqual(from.x)
    expect(line.x1).toBeLessThanOrEqual(from.x + from.width)
    expect(line.y1).toBeGreaterThanOrEqual(from.y)
    expect(line.y1).toBeLessThanOrEqual(from.y + from.height)
    // …fuera del interior estricto (está en el borde)
    const onBorder =
      line.x1 === from.x || line.x1 === from.x + from.width || line.y1 === from.y || line.y1 === from.y + from.height
    expect(onBorder).toBe(true)
    // y muere en el perímetro del destino
    const onTarget =
      line.x2 === to.x || line.x2 === to.x + to.width || line.y2 === to.y || line.y2 === to.y + to.height
    expect(onTarget).toBe(true)
  })
})

describe('edgeCurve — la flecha sale del campo, no del centro de la caja', () => {
  const from: NodeBox = { x: 100, y: 100, width: 240, height: 160 }
  const to: NodeBox = { x: 500, y: 300, width: 240, height: 112 }

  it('arranca en el borde derecho del origen, a la altura de su campo', () => {
    const curva = edgeCurve(from, 1, to)

    expect(curva.x1).toBe(from.x + from.width)
    // fila del campo 1, contando la del id que el diagrama pinta antes
    expect(curva.y1).toBe(from.y + MODEL_NODE.headerHeight + 2.5 * MODEL_NODE.rowHeight)
  })

  it('termina en el borde izquierdo del destino, a la altura de su clave', () => {
    const curva = edgeCurve(from, 0, to)

    expect(curva.x2).toBe(to.x)
    expect(curva.y2).toBe(to.y + MODEL_NODE.headerHeight + 0.5 * MODEL_NODE.rowHeight)
  })

  it('entra por la derecha cuando el destino está a la izquierda: nunca cruza la caja', () => {
    const izquierda: NodeBox = { x: 0, y: 300, width: 240, height: 112 }

    const curva = edgeCurve(from, 0, izquierda)

    expect(curva.x1).toBe(from.x)
    expect(curva.x2).toBe(izquierda.x + izquierda.width)
  })

  it('el trazo es una curva suave, con los tiradores en horizontal', () => {
    const curva = edgeCurve(from, 0, to)

    expect(curva.d).toMatch(/^M [\d.-]+ [\d.-]+ C/)
    expect(curva.d.split('C')[1].trim().split(/[ ,]+/)).toHaveLength(6)
  })

  it('la etiqueta va sobre el trazo, entre las dos cajas', () => {
    const curva = edgeCurve(from, 0, to)

    expect(curva.labelX).toBeGreaterThan(Math.min(curva.x1, curva.x2))
    expect(curva.labelX).toBeLessThan(Math.max(curva.x1, curva.x2))
  })
})

describe('edgeCurve — saltos largos', () => {
  const from: NodeBox = { x: 700, y: 100, width: 240, height: 160 }
  const lejosIzquierda: NodeBox = { x: 0, y: 100, width: 240, height: 160 }

  it('cuando hay sitio para otra caja en medio, el arco baja por debajo de ambas', () => {
    const curva = edgeCurve(from, 0, lejosIzquierda)
    // C cx1 cy1, cx2 cy2, x2 y2
    const [, cy1, , cy2] = curva.d.split('C')[1].trim().split(/[ ,]+/).map(Number)

    const suelo = Math.max(from.y + from.height, lejosIzquierda.y + lejosIzquierda.height)
    expect(cy1).toBeGreaterThan(suelo)
    expect(cy2).toBeGreaterThan(suelo)
  })

  it('un salto corto no baja: la curva se queda plana entre las dos filas', () => {
    const alLado: NodeBox = { x: 1000, y: 100, width: 240, height: 160 }

    const curva = edgeCurve(from, 0, alLado)
    const cy1 = Number(curva.d.split('C')[1].trim().split(/[ ,]+/)[1])

    expect(cy1).toBe(curva.y1)
  })
})
