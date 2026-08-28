/**
 * Agregaciones del panel (spec 71) y qué tipo de campo admite cada una. Es UNA regla consultada
 * por tres sitios —el use case emitido, la composición del generador y el panel del estudio—, así
 * que vive aquí: tres copias serían tres copias que divergen.
 */
export type AggregateOp = 'count' | 'sum' | 'avg' | 'min' | 'max' | 'distinct'

/** Los tipos de campo que se pueden agregar. Lo demás no se ofrece. */
export type AggregateFieldKind = 'numeric' | 'date'

export const AGGREGATE_OPS: AggregateOp[] = ['count', 'sum', 'avg', 'min', 'max', 'distinct']

/** `count` cuenta FILAS: no mide ninguna columna, así que no lleva campo (spec 72). */
export function opNeedsField(op: AggregateOp): boolean {
  return op !== 'count'
}

/** Sumar o promediar fechas no es una pregunta con respuesta; el resto de operaciones sí. */
const NUMERIC_ONLY: AggregateOp[] = ['sum', 'avg']

export function opAllowedOn(op: AggregateOp, kind: AggregateFieldKind): boolean {
  if (op === 'count') return true
  return kind === 'numeric' || !NUMERIC_ONLY.includes(op)
}

/** Las operaciones legales sobre un tipo, en el orden del catálogo. `count` no mide: queda fuera. */
export function opsAllowedOn(kind: AggregateFieldKind): AggregateOp[] {
  return AGGREGATE_OPS.filter(op => op !== 'count' && opAllowedOn(op, kind))
}

/**
 * El tipo agregable de un campo del modelo, o undefined si no se puede medir. Vivía copiado en
 * la composición, en build-substitutions y (sobre borradores) en el estudio: tres copias del
 * mismo mapeo alrededor del módulo que ya era su dueño (revisión specs 70-72).
 */
export function aggregateFieldKindOf(field: { type: string }): AggregateFieldKind | undefined {
  if (field.type === 'number' || field.type === 'integer') return 'numeric'
  if (field.type === 'date' || field.type === 'timestamptz') return 'date'
  return undefined
}
