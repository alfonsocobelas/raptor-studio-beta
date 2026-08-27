/**
 * Agregaciones del panel (spec 71) y qué tipo de campo admite cada una. Es UNA regla consultada
 * por tres sitios —el use case emitido, la composición del generador y el panel del estudio—, así
 * que vive aquí: tres copias serían tres copias que divergen.
 */
export type AggregateOp = 'sum' | 'avg' | 'min' | 'max' | 'distinct'

/** Los tipos de campo que se pueden agregar. Lo demás no se ofrece. */
export type AggregateFieldKind = 'numeric' | 'date'

export const AGGREGATE_OPS: AggregateOp[] = ['sum', 'avg', 'min', 'max', 'distinct']

/** Sumar o promediar fechas no es una pregunta con respuesta; el resto de operaciones sí. */
const NUMERIC_ONLY: AggregateOp[] = ['sum', 'avg']

export function opAllowedOn(op: AggregateOp, kind: AggregateFieldKind): boolean {
  return kind === 'numeric' || !NUMERIC_ONLY.includes(op)
}

/** Las operaciones legales sobre un tipo, en el orden del catálogo. */
export function opsAllowedOn(kind: AggregateFieldKind): AggregateOp[] {
  return AGGREGATE_OPS.filter(op => opAllowedOn(op, kind))
}
