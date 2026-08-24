import { describe, expect, it } from 'vitest'
import type { DraftResource } from './draft-resource'
import {
  autoLayout,
  canvasExtent,
  edgeCurve,
  edgeCurves,
  edgeLine,
  modelEdges,
  nodeAt,
  nodeBox,
  overlayLayout,
  MODEL_GRID,
  MODEL_NODE,
  type ModelEdge,
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

  it('respeta las coordenadas negativas: el lienzo es infinito y el mundo no empieza en cero', () => {
    const auto = autoLayout(['a'])

    const merged = overlayLayout(auto, { a: { x: -30, y: -5 } })

    expect(merged['a']).toEqual({ x: -30, y: -5 })
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
    const onTarget = line.x2 === to.x || line.x2 === to.x + to.width || line.y2 === to.y || line.y2 === to.y + to.height
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
    const izquierda: NodeBox = { x: -300, y: 300, width: 240, height: 112 }

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

/** Altura real de la curva en su punto medio (t = 0.5 de la Bézier cúbica). */
const alturaEnMedio = (curva: { d: string; y1: number; y2: number }): number => {
  const [, cy1, , cy2] = curva.d.split('C')[1].trim().split(/[ ,]+/).map(Number)
  return (curva.y1 + 3 * cy1 + 3 * cy2 + curva.y2) / 8
}

describe('edgeCurve — la curva esquiva las cajas que bloquean el camino, por el lado más corto', () => {
  // los anclajes de esta pareja dejan la banda del corredor en y 152..176
  const from: NodeBox = { x: 700, y: 100, width: 240, height: 160 }
  const lejosIzquierda: NodeBox = { x: 0, y: 100, width: 240, height: 160 }
  const enMedio: NodeBox = { x: 350, y: 100, width: 240, height: 160 }

  it('un obstáculo que asoma sobre todo por ARRIBA se esquiva buceando por debajo', () => {
    const alto: NodeBox = { x: 350, y: 0, width: 240, height: 200 }

    const curva = edgeCurve(from, 0, lejosIzquierda, [alto])

    expect(alturaEnMedio(curva)).toBeGreaterThan(alto.y + alto.height)
  })

  it('un obstáculo que asoma sobre todo por DEBAJO se esquiva por encima: la flecha no lo persigue al arrastrarlo hacia abajo', () => {
    const mascota: NodeBox = { x: 350, y: 160, width: 240, height: 160 }

    const curva = edgeCurve(from, 0, lejosIzquierda, [mascota])

    expect(alturaEnMedio(curva)).toBeLessThan(mascota.y)
  })

  it('sin obstáculos la curva se queda plana, por lejos que esté el destino', () => {
    const curva = edgeCurve(from, 0, lejosIzquierda)
    const cy1 = Number(curva.d.split('C')[1].trim().split(/[ ,]+/)[1])

    expect(cy1).toBe(curva.y1)
  })

  it('una caja fuera del corredor no obliga a desviarse', () => {
    const abajoDelTodo: NodeBox = { x: 350, y: 900, width: 240, height: 160 }

    const curva = edgeCurve(from, 0, lejosIzquierda, [abajoDelTodo])
    const cy1 = Number(curva.d.split('C')[1].trim().split(/[ ,]+/)[1])

    expect(cy1).toBe(curva.y1)
  })

  it('al bucear esquiva TAMBIÉN lo que encuentra al bajar, no solo el primer obstáculo', () => {
    const alto: NodeBox = { x: 350, y: -400, width: 240, height: 600 }
    const debajoDelAlto: NodeBox = { x: 350, y: 220, width: 240, height: 160 }

    const curva = edgeCurve(from, 0, lejosIzquierda, [alto, debajoDelAlto])

    expect(alturaEnMedio(curva)).toBeGreaterThan(debajoDelAlto.y + debajoDelAlto.height)
  })

  it('al subir esquiva TAMBIÉN lo que encuentra arriba: no se cuela por un hueco justo', () => {
    const mascota: NodeBox = { x: 350, y: 160, width: 240, height: 160 }
    const encimaDeMascota: NodeBox = { x: 350, y: 60, width: 240, height: 70 }

    const curva = edgeCurve(from, 0, lejosIzquierda, [mascota, encimaDeMascota])

    expect(alturaEnMedio(curva)).toBeLessThan(encimaDeMascota.y)
  })

  it('la etiqueta acompaña al arco: se pinta sobre su punto medio real, no sobre la línea recta', () => {
    const curva = edgeCurve(from, 0, lejosIzquierda, [enMedio])

    expect(curva.labelY).toBeCloseTo(alturaEnMedio(curva), 5)
  })
})

describe('edgeCurve — destino en la misma columna: la flecha entra en vertical, sin bucles', () => {
  const from: NodeBox = { x: 100, y: 400, width: 240, height: 160 }

  it('con el destino encima entra por su borde INFERIOR, no da la vuelta hasta el izquierdo', () => {
    const encima: NodeBox = { x: 100, y: 100, width: 240, height: 112 }

    const curva = edgeCurve(from, 0, encima)

    expect(curva.y2).toBe(encima.y + encima.height)
    expect(curva.x2).toBe(encima.x + encima.width / 2)
  })

  it('con el destino debajo entra por su borde SUPERIOR', () => {
    const debajo: NodeBox = { x: 100, y: 700, width: 240, height: 112 }

    const curva = edgeCurve(from, 0, debajo)

    expect(curva.y2).toBe(debajo.y)
    expect(curva.x2).toBe(debajo.x + debajo.width / 2)
  })

  it('la salida sigue anclada a la fila del campo ref, en un borde lateral del origen', () => {
    const encima: NodeBox = { x: 100, y: 100, width: 240, height: 112 }

    const curva = edgeCurve(from, 1, encima)

    expect(curva.y1).toBe(from.y + MODEL_NODE.headerHeight + 2.5 * MODEL_NODE.rowHeight)
    expect([from.x, from.x + from.width]).toContain(curva.x1)
  })

  it('la curva llega casi en vertical, con una pizca de ángulo para que la punta no se funda con el trazo', () => {
    const encima: NodeBox = { x: 100, y: 100, width: 240, height: 112 }

    const curva = edgeCurve(from, 0, encima)
    const [cx2, cy2] = curva.d.split('C')[1].trim().split(/[ ,]+/).slice(2, 4).map(Number)

    expect(cx2).not.toBe(curva.x2)
    expect(Math.abs(cx2 - curva.x2)).toBeLessThanOrEqual(24)
    expect(cy2).toBeGreaterThan(curva.y2)
  })
})

describe('edgeCurve — la punta entra con ángulo: una llegada plana funde la línea con el chevron', () => {
  it('en una entrada lateral el último tirador va un poco desviado de la fila de la clave', () => {
    const from: NodeBox = { x: 100, y: 100, width: 240, height: 160 }
    const to: NodeBox = { x: 500, y: 100, width: 240, height: 160 }

    const curva = edgeCurve(from, 0, to)
    const cy2 = Number(curva.d.split('C')[1].trim().split(/[ ,]+/)[3])

    expect(cy2).not.toBe(curva.y2)
    expect(Math.abs(cy2 - curva.y2)).toBeLessThanOrEqual(24)
  })
})

describe('edgeCurves — abanico de entradas: dos flechas al mismo lado no se pisan', () => {
  const edge = (from: string, to: string, fieldIndex = 1): ModelEdge => ({ from, to, fieldIndex, label: from })

  it('una sola arista es exactamente la de edgeCurve', () => {
    const boxes: Record<string, NodeBox> = {
      cita: { x: 100, y: 100, width: 240, height: 160 },
      paciente: { x: 500, y: 100, width: 240, height: 112 }
    }

    const [resultado] = edgeCurves([edge('cita', 'paciente')], boxes)

    expect(resultado.line).toEqual(edgeCurve(boxes['cita'], 1, boxes['paciente']))
  })

  it('dos aristas que entran por el mismo lado se reparten a lo largo del borde', () => {
    const boxes: Record<string, NodeBox> = {
      cita: { x: 100, y: 100, width: 240, height: 160 },
      factura: { x: 100, y: 320, width: 240, height: 160 },
      paciente: { x: 500, y: 200, width: 240, height: 112 }
    }

    const curvas = edgeCurves([edge('cita', 'paciente'), edge('factura', 'paciente')], boxes)

    const entradas = curvas.map(c => c.line.y2)
    expect(new Set(entradas).size).toBe(2)
    for (const y of entradas) {
      expect(y).toBeGreaterThanOrEqual(boxes['paciente'].y)
      expect(y).toBeLessThanOrEqual(boxes['paciente'].y + boxes['paciente'].height)
    }
  })

  it('las entradas respetan el orden de las salidas: la flecha que sale más arriba entra más arriba', () => {
    const boxes: Record<string, NodeBox> = {
      cita: { x: 100, y: 100, width: 240, height: 160 },
      factura: { x: 100, y: 320, width: 240, height: 160 },
      paciente: { x: 500, y: 200, width: 240, height: 112 }
    }

    const curvas = edgeCurves([edge('factura', 'paciente'), edge('cita', 'paciente')], boxes)
    const porOrigen = new Map(curvas.map(c => [c.edge.from, c.line.y2]))

    expect(porOrigen.get('cita')).toBeLessThan(porOrigen.get('factura') ?? Infinity)
  })

  it('las aristas hacia cajas de otro lado no cuentan en el reparto', () => {
    const boxes: Record<string, NodeBox> = {
      izquierda: { x: 100, y: 100, width: 240, height: 160 },
      derecha: { x: 900, y: 100, width: 240, height: 160 },
      paciente: { x: 500, y: 100, width: 240, height: 112 }
    }

    // una entra por la izquierda y otra por la derecha: cada una conserva la fila de la clave
    const curvas = edgeCurves([edge('izquierda', 'paciente'), edge('derecha', 'paciente')], boxes)

    const clave = boxes['paciente'].y + MODEL_NODE.headerHeight + 0.5 * MODEL_NODE.rowHeight
    expect(curvas[0].line.y2).toBe(clave)
    expect(curvas[1].line.y2).toBe(clave)
  })

  it('deriva los obstáculos del propio mapa de cajas: la arista que cruza una fila bucea sola', () => {
    const boxes: Record<string, NodeBox> = {
      cita: { x: 700, y: 100, width: 240, height: 160 },
      enMedio: { x: 350, y: 100, width: 240, height: 160 },
      paciente: { x: 0, y: 100, width: 240, height: 160 }
    }

    const [curva] = edgeCurves([edge('cita', 'paciente')], boxes)

    // esquiva por el lado más corto: aquí el arco pasa por encima del estorbo
    expect(alturaEnMedio(curva.line)).toBeLessThan(boxes['enMedio'].y)
  })

  it('ignora las aristas cuyas cajas no existen', () => {
    const boxes: Record<string, NodeBox> = { cita: { x: 0, y: 0, width: 240, height: 160 } }

    expect(edgeCurves([edge('cita', 'borrada')], boxes)).toEqual([])
  })
})

describe('canvasExtent — el lienzo tiene sitio de sobra para seguir dibujando', () => {
  const caja = (x: number, y: number): NodeBox => ({ x, y, width: 240, height: 120 })

  it('un lienzo vacío ya ocupa el mínimo: se puede arrastrar desde el primer momento', () => {
    const extent = canvasExtent([])

    expect(extent.width).toBeGreaterThanOrEqual(2000)
    expect(extent.height).toBeGreaterThanOrEqual(1200)
  })

  it('deja un colchón por detrás del contenido, no lo recorta al borde', () => {
    const extent = canvasExtent([caja(4000, 3000)])

    expect(extent.width).toBeGreaterThan(4000 + 240)
    expect(extent.height).toBeGreaterThan(3000 + 120)
  })

  it('crece con la caja más lejana, no con la primera', () => {
    const cerca = canvasExtent([caja(0, 0)])
    const lejos = canvasExtent([caja(0, 0), caja(3000, 2000)])

    expect(lejos.width).toBeGreaterThan(cerca.width)
    expect(lejos.height).toBeGreaterThan(cerca.height)
  })
})
