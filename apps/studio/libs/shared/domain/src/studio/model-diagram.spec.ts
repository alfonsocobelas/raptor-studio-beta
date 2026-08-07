import { describe, expect, it } from 'vitest'
import type { DraftResource } from './draft-resource'
import { autoLayout, edgeLine, modelEdges, nodeBox, MODEL_GRID, MODEL_NODE, type NodeBox } from './model-diagram'

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
