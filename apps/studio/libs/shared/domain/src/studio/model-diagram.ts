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
      return [name, dragged ? { x: Math.max(0, dragged.x), y: Math.max(0, dragged.y) } : position]
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

/**
 * La flecha de una relación sale del PUNTO DEL CAMPO `ref` —no del centro de la
 * caja— y entra por el lado de la clave del destino, como en la referencia de
 * diseño. Elige el lado por posición relativa, así que nunca cruza su propia
 * caja, y los tiradores van en horizontal para que la curva salga y entre plana.
 *
 * `fieldIndex` cuenta los campos del draft; el diagrama pinta antes la fila del
 * `id`, y por eso la fila real es la siguiente.
 */
export function edgeCurve(from: NodeBox, fieldIndex: number, to: NodeBox): EdgeCurve {
  const y1 = from.y + MODEL_NODE.headerHeight + (fieldIndex + 1.5) * MODEL_NODE.rowHeight
  const y2 = to.y + MODEL_NODE.headerHeight + 0.5 * MODEL_NODE.rowHeight

  // el destino manda el lado: si queda a la izquierda, se sale por la izquierda
  const haciaLaDerecha = to.x + to.width / 2 >= from.x + from.width / 2
  const x1 = haciaLaDerecha ? from.x + from.width : from.x
  const x2 = haciaLaDerecha ? to.x : to.x + to.width

  const tirador = Math.max(30, Math.abs(x2 - x1) / 2)
  const cx1 = haciaLaDerecha ? x1 + tirador : x1 - tirador
  const cx2 = haciaLaDerecha ? x2 - tirador : x2 + tirador

  /**
   * Si entre las dos cajas cabe otra, el arco baja por debajo de ambas: con los
   * tiradores planos la curva atravesaba la caja de en medio, que es justo lo que
   * hace ilegible un diagrama.
   */
  // basta con que quepa una caja en el trayecto; con el layout en fila el salto
  // de dos columnas mide exactamente el ancho de una caja más los dos huecos
  const salto = Math.abs(x2 - x1) > MODEL_NODE.width
  const suelo = Math.max(from.y + from.height, to.y + to.height) + MODEL_NODE.rowHeight * 1.5
  const cy1 = salto ? suelo : y1
  const cy2 = salto ? suelo : y2

  return {
    x1,
    y1,
    x2,
    y2,
    d: `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`,
    labelX: (x1 + x2) / 2,
    labelY: salto ? (suelo + Math.max(y1, y2)) / 2 : (y1 + y2) / 2
  }
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

/** Ningún nodo se arrastra fuera por arriba o por la izquierda: ahí no hay lienzo. */
export function clampToCanvas(position: NodePosition): NodePosition {
  return { x: Math.max(0, position.x), y: Math.max(0, position.y) }
}
