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

  it('una caja alta empuja la fila siguiente: siempre queda pasillo entre filas', () => {
    // 'a' tiene muchos campos: su alto supera de largo la fila fija de siempre
    const alturas = [MODEL_NODE.headerHeight + 14 * MODEL_NODE.rowHeight, 100, 100, 100]

    const positions = autoLayout(['a', 'b', 'c', 'd'], alturas)

    expect(positions['d'].y).toBeGreaterThanOrEqual(MODEL_GRID.margin + alturas[0] + MODEL_GRID.vGap)
  })

  it('el pasillo horizontal entre columnas da sitio a los carriles de las flechas', () => {
    expect(MODEL_GRID.colWidth - MODEL_NODE.width).toBeGreaterThanOrEqual(80)
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

  it('el trazo es ortogonal: solo tramos horizontales y verticales', () => {
    const curva = edgeCurve(from, 0, to)

    expect(esOrtogonal(curva.points)).toBe(true)
    expect(curva.points.length).toBeGreaterThanOrEqual(2)
  })

  it('la etiqueta va sobre el trazo, entre las dos cajas', () => {
    const curva = edgeCurve(from, 0, to)

    expect(curva.labelX).toBeGreaterThan(Math.min(curva.x1, curva.x2))
    expect(curva.labelX).toBeLessThan(Math.max(curva.x1, curva.x2))
    expect(sobreElTrazo(curva)).toBe(true)
  })
})

/** ¿Algún tramo de la polilínea invade el INTERIOR de la caja? (rozar el borde no cuenta). */
const atraviesa = (points: readonly { x: number; y: number }[], box: NodeBox): boolean =>
  points.slice(1).some((p, i) => {
    const q = points[i]
    const [xa, xb] = [Math.min(p.x, q.x), Math.max(p.x, q.x)]
    const [ya, yb] = [Math.min(p.y, q.y), Math.max(p.y, q.y)]
    return xa < box.x + box.width && xb > box.x && ya < box.y + box.height && yb > box.y
  })

/** ¿Cada tramo es horizontal o vertical? */
const esOrtogonal = (points: readonly { x: number; y: number }[]): boolean =>
  points.slice(1).every((p, i) => p.x === points[i].x || p.y === points[i].y)

/** ¿Dos polilíneas comparten algún tramo casi-colineal (a menos de 8px) con solape? */
const seFunden = (a: readonly { x: number; y: number }[], b: readonly { x: number; y: number }[]): boolean =>
  a.slice(1).some((p, i) =>
    b.slice(1).some((q, j) => {
      const [pa, qa] = [a[i], b[j]]
      const vertA = p.x === pa.x && p.y !== pa.y
      const vertB = q.x === qa.x && q.y !== qa.y
      if (vertA && vertB) {
        return (
          Math.abs(p.x - q.x) < 8 &&
          Math.min(p.y, pa.y) < Math.max(q.y, qa.y) &&
          Math.max(p.y, pa.y) > Math.min(q.y, qa.y)
        )
      }
      if (!vertA && !vertB && p.y === pa.y && q.y === qa.y) {
        return (
          Math.abs(p.y - q.y) < 8 &&
          Math.min(p.x, pa.x) < Math.max(q.x, qa.x) &&
          Math.max(p.x, pa.x) > Math.min(q.x, qa.x)
        )
      }
      return false
    })
  )

/** ¿La etiqueta cae sobre alguno de los tramos? */
const sobreElTrazo = (curva: {
  points: readonly { x: number; y: number }[]
  labelX: number
  labelY: number
}): boolean =>
  curva.points.slice(1).some((p, i) => {
    const q = curva.points[i]
    const [xa, xb] = [Math.min(p.x, q.x), Math.max(p.x, q.x)]
    const [ya, yb] = [Math.min(p.y, q.y), Math.max(p.y, q.y)]
    return curva.labelX >= xa && curva.labelX <= xb && curva.labelY >= ya && curva.labelY <= yb
  })

describe('edgeCurve — la ruta rodea las cajas: ningún tramo pisa un obstáculo', () => {
  // los anclajes de esta pareja dejan la banda del corredor en y 152..176
  const from: NodeBox = { x: 700, y: 100, width: 240, height: 160 }
  const lejosIzquierda: NodeBox = { x: 0, y: 100, width: 240, height: 160 }
  const enMedio: NodeBox = { x: 350, y: 100, width: 240, height: 160 }

  it('con una caja en medio del corredor, la ruta no la atraviesa (y sigue siendo ortogonal)', () => {
    const curva = edgeCurve(from, 0, lejosIzquierda, [enMedio])

    expect(atraviesa(curva.points, enMedio)).toBe(false)
    expect(esOrtogonal(curva.points)).toBe(true)
  })

  it('el obstáculo arrastrado hacia abajo no arrastra la flecha: la ruta tampoco lo pisa ahí', () => {
    const mascota: NodeBox = { x: 350, y: 160, width: 240, height: 160 }

    const curva = edgeCurve(from, 0, lejosIzquierda, [mascota])

    expect(atraviesa(curva.points, mascota)).toBe(false)
  })

  it('sin obstáculos la ruta es la mínima: saliente, canal y entrada, sin excursiones', () => {
    const curva = edgeCurve(from, 0, lejosIzquierda)

    expect(curva.points.length).toBeLessThanOrEqual(4)
    for (const p of curva.points) {
      expect(p.y).toBeGreaterThanOrEqual(Math.min(curva.y1, curva.y2))
      expect(p.y).toBeLessThanOrEqual(Math.max(curva.y1, curva.y2))
    }
  })

  it('una caja fuera del corredor no obliga a desviarse', () => {
    const abajoDelTodo: NodeBox = { x: 350, y: 900, width: 240, height: 160 }

    const curva = edgeCurve(from, 0, lejosIzquierda, [abajoDelTodo])

    expect(curva.points.length).toBeLessThanOrEqual(4)
  })

  it('con varias cajas bloqueando, la ruta no pisa NINGUNA', () => {
    const obstaculos: NodeBox[] = [
      { x: 350, y: -400, width: 240, height: 600 },
      { x: 350, y: 220, width: 240, height: 160 }
    ]

    const curva = edgeCurve(from, 0, lejosIzquierda, obstaculos)

    for (const caja of obstaculos) expect(atraviesa(curva.points, caja)).toBe(false)
    expect(esOrtogonal(curva.points)).toBe(true)
  })

  it('tampoco pisa el hueco justo: si no cabe entre dos cajas, las rodea a las dos', () => {
    const obstaculos: NodeBox[] = [
      { x: 350, y: 160, width: 240, height: 160 },
      { x: 350, y: 60, width: 240, height: 70 }
    ]

    const curva = edgeCurve(from, 0, lejosIzquierda, obstaculos)

    for (const caja of obstaculos) expect(atraviesa(curva.points, caja)).toBe(false)
  })

  it('la etiqueta acompaña a la ruta: cae sobre uno de sus tramos', () => {
    const curva = edgeCurve(from, 0, lejosIzquierda, [enMedio])

    expect(sobreElTrazo(curva)).toBe(true)
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

  it('el último tramo es vertical: la flecha aterriza perpendicular al borde', () => {
    const encima: NodeBox = { x: 100, y: 100, width: 240, height: 112 }

    const curva = edgeCurve(from, 0, encima)
    const [penultimo, ultimo] = curva.points.slice(-2)

    expect(esOrtogonal(curva.points)).toBe(true)
    expect(ultimo.x).toBe(penultimo.x)
    expect(ultimo.x).toBe(curva.x2)
  })
})

describe('edgeCurve — el trazo se detiene antes del ancla: hueco para que el chevron no se funda con la línea', () => {
  it('el path acaba unos px antes del borde del destino; los anclajes lógicos no cambian', () => {
    const from: NodeBox = { x: 100, y: 100, width: 240, height: 160 }
    const to: NodeBox = { x: 500, y: 100, width: 240, height: 160 }

    const curva = edgeCurve(from, 0, to)
    const numeros = curva.d
      .trim()
      .split(/[ ,]+/)
      .filter(n => /^[\d.-]+$/.test(n))
      .map(Number)
    const [finX, finY] = numeros.slice(-2)

    const hueco = Math.hypot(curva.x2 - finX, curva.y2 - finY)
    expect(hueco).toBeGreaterThan(0)
    expect(hueco).toBeLessThanOrEqual(12)
    // el ancla lógica sigue en el borde: de ella cuelgan la selección y el botón de borrar
    expect(curva.x2).toBe(to.x)
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

    expect(atraviesa(curva.line.points, boxes['enMedio'])).toBe(false)
  })

  it('dos rutas que comparten pasillo no se funden: cada una toma su carril', () => {
    const boxes: Record<string, NodeBox> = {
      origen: { x: 600, y: 100, width: 240, height: 160 },
      uno: { x: 0, y: 300, width: 240, height: 112 },
      dos: { x: 0, y: 440, width: 240, height: 112 }
    }

    // ambas salen por la izquierda de `origen` y su canal preferido es el mismo punto medio
    const curvas = edgeCurves([edge('origen', 'uno', 1), edge('origen', 'dos', 2)], boxes)

    expect(seFunden(curvas[0].line.points, curvas[1].line.points)).toBe(false)
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
