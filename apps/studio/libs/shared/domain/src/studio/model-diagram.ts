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

/** Colchón vertical con el que la curva rodea un obstáculo. */
const CLEARANCE = MODEL_NODE.rowHeight

/** Desvío del último tirador: una llegada perfectamente plana funde la línea con el chevron. */
const ENTRY_TILT = 16

/**
 * Hasta dónde tiene que bajar una curva lateral para no atravesar ninguna caja:
 * si algún obstáculo pisa la banda entre los dos anclajes, el fondo baja por
 * debajo de él — y se vuelve a mirar, porque al bajar puede toparse con otra
 * fila: solo se cuela por un hueco si cabe con colchón por los dos lados.
 * Devuelve null cuando el camino está despejado y la curva puede ir plana.
 */
function fondoDelCorredor(x1: number, y1: number, x2: number, y2: number, obstacles: NodeBox[]): number | null {
  const izquierda = Math.min(x1, x2)
  const derecha = Math.max(x1, x2)
  const enElCorredor = obstacles.filter(o => o.x <= derecha && o.x + o.width >= izquierda)

  const techo = Math.min(y1, y2)
  let fondo: number | null = null
  for (let quedan = enElCorredor.length; quedan > 0; quedan--) {
    const limite = fondo === null ? Math.max(y1, y2) : fondo + 2 * CLEARANCE
    const choque = enElCorredor.find(o => o.y + o.height > (fondo ?? techo) && o.y < limite)
    if (!choque) break
    fondo = choque.y + choque.height
  }
  return fondo
}

/**
 * La curva desde el campo `ref` del origen hasta un punto de entrada dado. La
 * salida sigue anclada a la fila del campo —por el lateral que mira a la
 * entrada— y los tiradores son perpendiculares a cada borde: la flecha sale
 * plana y entra plana (laterales) o vertical (arriba/abajo).
 */
function curveInto(from: NodeBox, fieldIndex: number, entry: EntryPoint, obstacles: NodeBox[]): EdgeCurve {
  const y1 = from.y + MODEL_NODE.headerHeight + (fieldIndex + 1.5) * MODEL_NODE.rowHeight
  const { x: x2, y: y2 } = entry

  const salidaDerecha = x2 >= from.x + from.width / 2
  const x1 = salidaDerecha ? from.x + from.width : from.x

  const tirador = Math.max(
    30,
    (entry.side === 'top' || entry.side === 'bottom' ? Math.abs(y2 - y1) : Math.abs(x2 - x1)) / 2
  )
  const cx1 = salidaDerecha ? x1 + tirador : x1 - tirador

  if (entry.side === 'top' || entry.side === 'bottom') {
    const cy2 = entry.side === 'bottom' ? y2 + tirador : y2 - tirador
    // la punta llega casi vertical, ladeada hacia donde viene la curva
    const cx2 = x2 + ENTRY_TILT * (x1 >= x2 ? 1 : -1)
    return {
      x1,
      y1,
      x2,
      y2,
      d: `M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${cy2}, ${x2} ${y2}`,
      labelX: (x1 + x2) / 2,
      labelY: (y1 + y2) / 2
    }
  }

  const cx2 = entry.side === 'left' ? x2 - tirador : x2 + tirador

  /**
   * Si una caja bloquea el corredor entre los dos anclajes, el arco bucea por
   * debajo de ella (y de lo que encuentre al bajar): con los tiradores planos la
   * curva atravesaba la caja de en medio, que es justo lo que hace ilegible un
   * diagrama. Con el camino despejado la curva va plana, por lejos que quede el
   * destino. Los tiradores se calculan para que el PUNTO MEDIO real de la Bézier
   * (y(0.5) = (y1 + 6·c + y2) / 8) pase por debajo del fondo, no solo el mando.
   */
  const fondo = fondoDelCorredor(x1, y1, x2, y2, obstacles)
  const control = fondo === null ? null : (8 * (fondo + CLEARANCE) - y1 - y2) / 6
  const cy1 = control ?? y1
  // en plano la punta llega con una pizca de ángulo (buceando el arco ya la trae inclinada)
  const cy2 = control ?? y2 + ENTRY_TILT * (y1 >= y2 ? 1 : -1)

  return {
    x1,
    y1,
    x2,
    y2,
    d: `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`,
    labelX: (x1 + x2) / 2,
    // la etiqueta viaja con el trazo: en un arco se pinta sobre su punto medio real
    labelY: (y1 + 3 * cy1 + 3 * cy2 + y2) / 8
  }
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
