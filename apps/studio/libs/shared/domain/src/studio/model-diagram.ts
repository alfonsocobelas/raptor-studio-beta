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
