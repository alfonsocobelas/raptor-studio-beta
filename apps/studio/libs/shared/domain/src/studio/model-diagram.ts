import type { DraftResource } from './draft-resource'

/**
 * Helpers puros de la vista de modelo (spec 15, fase 4). Las aristas se DERIVAN
 * de los campos `ref` de los drafts — el diagrama nunca almacena relaciones — y
 * el layout es cosmético: vive en memoria del componente, jamás en el schema.
 */
export interface ModelEdge {
  from: string
  to: string
  /** Índice del campo `ref` dentro de `from.fields`: lo que hay que borrar para quitar la flecha */
  fieldIndex: number
  label: string
}

export interface NodePosition {
  x: number
  y: number
}

export interface NodeBox {
  x: number
  y: number
  width: number
  height: number
}

export interface EdgeSegment {
  x1: number
  y1: number
  x2: number
  y2: number
}

/** Rejilla del auto-layout: mismas entidades → mismas posiciones (determinismo). */
export const MODEL_GRID = {
  columns: 3,
  colWidth: 300,
  rowHeight: 260,
  margin: 40
} as const

/**
 * Posiciones manuales (arrastre) por encima del auto-layout: solo cuentan las
 * de entidades vivas y ninguna caja puede salirse del lienzo por arriba/izquierda.
 */
export function overlayLayout(
  auto: Record<string, NodePosition>,
  manual: Record<string, NodePosition>
): Record<string, NodePosition> {
  return Object.fromEntries(
    Object.entries(auto).map(([name, position]) => {
      const dragged = manual[name]
      // sin recortes: el lienzo es infinito y una caja puede vivir en coordenadas negativas
      return [name, dragged ?? position]
    })
  )
}

/** Caja bajo un punto del lienzo (bordes incluidos), o null si cae en el vacío. */
export function nodeAt(point: NodePosition, boxes: Record<string, NodeBox>): string | null {
  for (const [name, box] of Object.entries(boxes)) {
    if (point.x >= box.x && point.x <= box.x + box.width && point.y >= box.y && point.y <= box.y + box.height) {
      return name
    }
  }
  return null
}

/** Dimensiones de una caja del diagrama: el alto lo dictan los campos. */
export const MODEL_NODE = {
  width: 240,
  headerHeight: 40,
  rowHeight: 24
} as const

export function nodeBox(position: NodePosition, fieldCount: number): NodeBox {
  return {
    x: position.x,
    y: position.y,
    width: MODEL_NODE.width,
    height: MODEL_NODE.headerHeight + fieldCount * MODEL_NODE.rowHeight
  }
}

export function modelEdges(resources: DraftResource[]): ModelEdge[] {
  return resources.flatMap(resource =>
    resource.fields.flatMap((field, fieldIndex) =>
      field.type === 'ref' && field.refTo
        ? [{ from: resource.name, to: field.refTo, fieldIndex, label: field.label }]
        : []
    )
  )
}

export function autoLayout(names: string[]): Record<string, NodePosition> {
  return Object.fromEntries(
    names.map((name, i) => [
      name,
      {
        x: MODEL_GRID.margin + (i % MODEL_GRID.columns) * MODEL_GRID.colWidth,
        y: MODEL_GRID.margin + Math.floor(i / MODEL_GRID.columns) * MODEL_GRID.rowHeight
      }
    ])
  )
}

/**
 * Segmento centro-a-centro recortado al perímetro de ambas cajas: la flecha
 * nace en el borde del origen y muere en el borde del destino.
 */
export function edgeLine(from: NodeBox, to: NodeBox): EdgeSegment {
  const a = center(from)
  const b = center(to)
  const start = clipToBorder(from, a, b)
  const end = clipToBorder(to, b, a)
  return { x1: start.x, y1: start.y, x2: end.x, y2: end.y }
}

function center(box: NodeBox): NodePosition {
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

/** Punto donde el rayo centro→objetivo cruza el perímetro de la caja. */
function clipToBorder(box: NodeBox, from: NodePosition, towards: NodePosition): NodePosition {
  const dx = towards.x - from.x
  const dy = towards.y - from.y
  if (dx === 0 && dy === 0) return from

  // factor t mínimo que lleva el rayo hasta un borde vertical u horizontal
  const tx = dx !== 0 ? (dx > 0 ? box.x + box.width - from.x : box.x - from.x) / dx : Infinity
  const ty = dy !== 0 ? (dy > 0 ? box.y + box.height - from.y : box.y - from.y) / dy : Infinity
  const t = Math.min(tx, ty)
  return { x: from.x + dx * t, y: from.y + dy * t }
}

export interface EdgeCurve extends EdgeSegment {
  /** Trazo SVG listo para `path[d]` */
  d: string
  labelX: number
  labelY: number
  /** Esquinas de la polilínea ortogonal (anclajes incluidos): la verdad geométrica de la ruta */
  points: NodePosition[]
}

/** Lado del destino por el que entra una flecha. */
type EntrySide = 'left' | 'right' | 'top' | 'bottom'

interface EntryPoint {
  side: EntrySide
  x: number
  y: number
}

/**
 * Lado de entrada según la posición relativa: si hay hueco horizontal entre las
 * cajas, la flecha entra por el lateral que mira al origen (el look clásico de
 * un ER, con la entrada en la fila de la clave). Si comparten columna, entra en
 * vertical: por abajo si el destino está encima, por arriba si está debajo —
 * antes salía por la derecha para volver al lado izquierdo, un bucle en S.
 */
function entrySide(from: NodeBox, to: NodeBox): EntrySide {
  if (to.x >= from.x + from.width) return 'left'
  if (to.x + to.width <= from.x) return 'right'
  return to.y + to.height / 2 <= from.y + from.height / 2 ? 'bottom' : 'top'
}

/** Punto de entrada por defecto de un lado: fila de la clave en los laterales, centro en los verticales. */
function defaultEntry(to: NodeBox, side: EntrySide): EntryPoint {
  const keyRow = to.y + MODEL_NODE.headerHeight + 0.5 * MODEL_NODE.rowHeight
  switch (side) {
    case 'left':
      return { side, x: to.x, y: keyRow }
    case 'right':
      return { side, x: to.x + to.width, y: keyRow }
    case 'top':
      return { side, x: to.x + to.width / 2, y: to.y }
    case 'bottom':
      return { side, x: to.x + to.width / 2, y: to.y + to.height }
  }
}

/** Colchón con el que las rutas rodean las cajas. */
const CLEARANCE = MODEL_NODE.rowHeight

/** Saliente mínimo antes del primer giro: la flecha despega del borde antes de doblar. */
const STUB = 16

/** Radio de las esquinas redondeadas del trazo. */
const CORNER = 8

/** El trazo se detiene este hueco antes del ancla: así el chevron no se funde con la línea. */
const TIP_GAP = 8

/** ¿Un tramo horizontal en `y` entre `xa..xb` invade el interior de alguna caja? (rozar el borde no cuenta). */
function chocaH(y: number, xa: number, xb: number, obstacles: NodeBox[]): boolean {
  const [a, b] = xa <= xb ? [xa, xb] : [xb, xa]
  return obstacles.some(o => o.x < b && o.x + o.width > a && o.y < y && o.y + o.height > y)
}

/** ¿Un tramo vertical en `x` entre `ya..yb` invade el interior de alguna caja? */
function chocaV(x: number, ya: number, yb: number, obstacles: NodeBox[]): boolean {
  const [a, b] = ya <= yb ? [ya, yb] : [yb, ya]
  return obstacles.some(o => o.y < b && o.y + o.height > a && o.x < x && o.x + o.width > x)
}

/** Quita puntos repetidos y codos colineales: una Z plana se queda en línea recta. */
function depura(points: NodePosition[]): NodePosition[] {
  const limpios: NodePosition[] = []
  for (const p of points) {
    const a = limpios[limpios.length - 2]
    const b = limpios[limpios.length - 1]
    if (b && b.x === p.x && b.y === p.y) continue
    if (a && b && ((a.x === b.x && b.x === p.x) || (a.y === b.y && b.y === p.y))) limpios.pop()
    limpios.push(p)
  }
  return limpios
}

/**
 * Ruta ortogonal hacia una entrada LATERAL. Primero se intenta la Z clásica
 * (saliente, canal vertical, entrada) probando canales libres —el del medio y
 * los pegados a cada obstáculo—; si ninguno pasa, se rodea en U por un canal
 * horizontal libre. Cada tramo se comprueba contra TODAS las cajas, así que la
 * ruta elegida no pisa ninguna; solo si las cajas se solapan entre sí (arrastre
 * extremo) se acepta la menos mala.
 */
function rutaLateral(
  x1: number,
  y1: number,
  s1: number,
  x2: number,
  y2: number,
  e: number,
  obstacles: NodeBox[]
): NodePosition[] {
  const candidatosZ = [
    (x1 + x2) / 2,
    x1 + s1 * STUB,
    x2 + e * STUB,
    ...obstacles.flatMap(o => [o.x - CLEARANCE, o.x + o.width + CLEARANCE])
  ]
    .filter(xm => (xm - x1) * s1 >= STUB && (xm - x2) * e >= STUB)
    .sort((a, b) => Math.abs(a - (x1 + x2) / 2) - Math.abs(b - (x1 + x2) / 2))

  for (const xm of candidatosZ) {
    if (!chocaH(y1, x1, xm, obstacles) && !chocaV(xm, y1, y2, obstacles) && !chocaH(y2, xm, x2, obstacles)) {
      return [
        { x: x1, y: y1 },
        { x: xm, y: y1 },
        { x: xm, y: y2 },
        { x: x2, y: y2 }
      ]
    }
  }

  const xv1 = x1 + s1 * STUB
  const xv2 = x2 + e * STUB
  const centroBanda = (y1 + y2) / 2
  const canales = obstacles
    .flatMap(o => [o.y - CLEARANCE, o.y + o.height + CLEARANCE])
    .concat(Math.min(y1, y2) - 2 * CLEARANCE, Math.max(y1, y2) + 2 * CLEARANCE)
    .sort((a, b) => Math.abs(a - centroBanda) - Math.abs(b - centroBanda))
  const enU = (yc: number): NodePosition[] => [
    { x: x1, y: y1 },
    { x: xv1, y: y1 },
    { x: xv1, y: yc },
    { x: xv2, y: yc },
    { x: xv2, y: y2 },
    { x: x2, y: y2 }
  ]

  for (const yc of canales) {
    if (
      !chocaH(y1, x1, xv1, obstacles) &&
      !chocaV(xv1, y1, yc, obstacles) &&
      !chocaH(yc, xv1, xv2, obstacles) &&
      !chocaV(xv2, yc, y2, obstacles) &&
      !chocaH(y2, xv2, x2, obstacles)
    ) {
      return enU(yc)
    }
  }
  return enU(canales[0])
}

/**
 * Ruta ortogonal hacia una entrada VERTICAL (mismas columnas): en directo es una
 * L —por la fila del campo hasta la x de entrada y de ahí al borde—; si la L
 * retrocede sobre la propia caja o choca, sale por el lateral, viaja por el
 * canal pegado a la entrada y aterriza en vertical.
 */
function rutaVertical(
  x1: number,
  y1: number,
  s1: number,
  x2: number,
  y2: number,
  ev: number,
  obstacles: NodeBox[]
): NodePosition[] {
  const directa = (x2 - x1) * s1 >= STUB
  if (directa && !chocaH(y1, x1, x2, obstacles) && !chocaV(x2, y1, y2, obstacles)) {
    return [
      { x: x1, y: y1 },
      { x: x2, y: y1 },
      { x: x2, y: y2 }
    ]
  }

  const xv = x1 + s1 * STUB
  const ym = y2 + ev * CLEARANCE
  return [
    { x: x1, y: y1 },
    { x: xv, y: y1 },
    { x: xv, y: ym },
    { x: x2, y: ym },
    { x: x2, y: y2 }
  ]
}

/** Recorta el final de la ruta TIP_GAP px: el hueco donde vive el chevron. */
function recortaParaLaPunta(points: NodePosition[]): NodePosition[] {
  const fin = points[points.length - 1]
  const previo = points[points.length - 2]
  const largo = Math.hypot(fin.x - previo.x, fin.y - previo.y)
  const recorte = Math.min(TIP_GAP, largo / 2)
  const corto = {
    x: fin.x + (largo === 0 ? 0 : ((previo.x - fin.x) / largo) * recorte),
    y: fin.y + (largo === 0 ? 0 : ((previo.y - fin.y) / largo) * recorte)
  }
  return [...points.slice(0, -1), corto]
}

/** El path SVG de la polilínea, con las esquinas redondeadas y el hueco de la punta. */
function trazo(points: NodePosition[]): string {
  const pts = recortaParaLaPunta(points)
  let d = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1]
    const b = pts[i]
    const c = pts[i + 1]
    const radio = Math.min(CORNER, Math.hypot(b.x - a.x, b.y - a.y) / 2, Math.hypot(c.x - b.x, c.y - b.y) / 2)
    const hacia = (desde: NodePosition, meta: NodePosition): NodePosition => {
      const largo = Math.hypot(meta.x - desde.x, meta.y - desde.y)
      return largo === 0
        ? desde
        : { x: desde.x + ((meta.x - desde.x) / largo) * radio, y: desde.y + ((meta.y - desde.y) / largo) * radio }
    }
    const entrada = hacia(b, a)
    const salida = hacia(b, c)
    d += ` L ${entrada.x} ${entrada.y} Q ${b.x} ${b.y} ${salida.x} ${salida.y}`
  }
  const fin = pts[pts.length - 1]
  return `${d} L ${fin.x} ${fin.y}`
}

/** La etiqueta va al punto medio del tramo más largo: ahí hay sitio de sobra. */
function puntoDeEtiqueta(points: NodePosition[]): NodePosition {
  let mejor = { largo: -1, x: 0, y: 0 }
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]
    const b = points[i]
    const largo = Math.hypot(b.x - a.x, b.y - a.y)
    if (largo > mejor.largo) mejor = { largo, x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
  }
  return { x: mejor.x, y: mejor.y }
}

/**
 * La ruta desde el campo `ref` del origen hasta un punto de entrada dado: sale
 * anclada a la fila del campo por el lateral que mira a la entrada, viaja en
 * tramos ortogonales que RODEAN las cajas y aterriza perpendicular al borde de
 * entrada. Los anclajes lógicos (x1,y1,x2,y2) quedan en los bordes; el trazo se
 * recorta unos px antes de la punta para que el chevron no se funda con la línea.
 */
function curveInto(from: NodeBox, fieldIndex: number, entry: EntryPoint, obstacles: NodeBox[]): EdgeCurve {
  const y1 = from.y + MODEL_NODE.headerHeight + (fieldIndex + 1.5) * MODEL_NODE.rowHeight
  const { x: x2, y: y2 } = entry

  const salidaDerecha = x2 >= from.x + from.width / 2
  const x1 = salidaDerecha ? from.x + from.width : from.x
  const s1 = salidaDerecha ? 1 : -1

  const lateral = entry.side === 'left' || entry.side === 'right'
  // el lado LIBRE de la entrada: por dónde tiene que llegar el último tramo
  const e = entry.side === 'left' || entry.side === 'top' ? -1 : 1
  const points = depura(
    lateral ? rutaLateral(x1, y1, s1, x2, y2, e, obstacles) : rutaVertical(x1, y1, s1, x2, y2, e, obstacles)
  )
  const etiqueta = puntoDeEtiqueta(points)

  return { x1, y1, x2, y2, d: trazo(points), labelX: etiqueta.x, labelY: etiqueta.y, points }
}

/**
 * La flecha de una relación sale del PUNTO DEL CAMPO `ref` —no del centro de la
 * caja— y entra por el lado del destino que mira al origen, como en la
 * referencia de diseño. `fieldIndex` cuenta los campos del draft; el diagrama
 * pinta antes la fila del `id`, y por eso la fila real es la siguiente.
 */
export function edgeCurve(from: NodeBox, fieldIndex: number, to: NodeBox, obstacles: NodeBox[] = []): EdgeCurve {
  return curveInto(from, fieldIndex, defaultEntry(to, entrySide(from, to)), obstacles)
}

/**
 * Las curvas de TODAS las aristas a la vez: cuando varias entran por el mismo
 * lado de la misma caja, los puntos de entrada se reparten a lo largo del borde
 * —ordenados por dónde salen, para que no se crucen— en vez de apilarse todos
 * sobre la fila de la clave. Las aristas sin caja (entidad borrada) se omiten.
 */
export function edgeCurves(edges: ModelEdge[], boxes: Record<string, NodeBox>): { edge: ModelEdge; line: EdgeCurve }[] {
  const vivas = edges.flatMap(edge => {
    const from = boxes[edge.from]
    const to = boxes[edge.to]
    return from && to ? [{ edge, from, to, side: entrySide(from, to) }] : []
  })

  // los obstáculos de cada arista son TODAS las demás cajas: origen y destino no estorban
  const estorbos = ({ edge }: (typeof vivas)[number]) =>
    Object.entries(boxes).flatMap(([name, box]) => (name === edge.from || name === edge.to ? [] : [box]))

  const grupos = new Map<string, typeof vivas>()
  for (const arista of vivas) {
    const clave = `${arista.edge.to}|${arista.side}`
    grupos.set(clave, [...(grupos.get(clave) ?? []), arista])
  }

  const lineas = new Map<ModelEdge, EdgeCurve>()
  for (const grupo of grupos.values()) {
    if (grupo.length === 1) {
      const { edge, from, to, side } = grupo[0]
      lineas.set(edge, curveInto(from, edge.fieldIndex, defaultEntry(to, side), estorbos(grupo[0])))
      continue
    }
    // reparto uniforme por el borde, en el orden de las salidas para no cruzarse
    const lateral = grupo[0].side === 'left' || grupo[0].side === 'right'
    const salida = ({ edge, from }: (typeof grupo)[number]) =>
      lateral
        ? from.y + MODEL_NODE.headerHeight + (edge.fieldIndex + 1.5) * MODEL_NODE.rowHeight
        : from.x + from.width / 2
    for (const [i, arista] of [...grupo].sort((a, b) => salida(a) - salida(b)).entries()) {
      const { edge, from, to, side } = arista
      const paso = (i + 1) / (grupo.length + 1)
      const entry: EntryPoint = lateral
        ? { side, x: side === 'left' ? to.x : to.x + to.width, y: to.y + to.height * paso }
        : { side, x: to.x + to.width * paso, y: side === 'top' ? to.y : to.y + to.height }
      lineas.set(edge, curveInto(from, edge.fieldIndex, entry, estorbos(arista)))
    }
  }

  return vivas.map(({ edge }) => ({ edge, line: lineas.get(edge) as EdgeCurve }))
}

/** Mínimos del lienzo: hay sitio para arrastrar aunque no haya nada dibujado. */
export const CANVAS_MIN = { width: 2400, height: 1400 } as const

/** Colchón por detrás del contenido, para que arrastrar al borde no se acabe el papel. */
export const CANVAS_PADDING = 600

/**
 * Tamaño del lienzo: el contenido más un colchón generoso, y nunca menos que el
 * mínimo. Antes medía justo lo que ocupaban las cajas, así que no se podía arrastrar
 * nada más allá del borde ni había scroll donde seguir dibujando.
 */
export function canvasExtent(boxes: NodeBox[]): { width: number; height: number } {
  const derecha = Math.max(0, ...boxes.map(box => box.x + box.width))
  const abajo = Math.max(0, ...boxes.map(box => box.y + box.height))
  return {
    width: Math.max(CANVAS_MIN.width, derecha + CANVAS_PADDING),
    height: Math.max(CANVAS_MIN.height, abajo + CANVAS_PADDING)
  }
}
