import { InvalidArgumentError } from '../errors'

/**
 * Agregaciones que la API sabe responder (spec 71). Ni una más: cada una tiene que ser expresable
 * en LOS DOS motores de persistencia, y los percentiles y las medianas no lo son de forma portable.
 */
export const AGGREGATE_OPS = ['sum', 'avg', 'min', 'max', 'distinct'] as const

export type AggregateOp = (typeof AGGREGATE_OPS)[number]

/** Tipos de campo agregables; los declara la config de cada recurso. */
export type AggregateFieldKind = 'numeric' | 'date'

/** Sumar o promediar fechas no es una pregunta con respuesta. El resto de operaciones sí. */
export function opAllowedOn(op: AggregateOp, kind: AggregateFieldKind): boolean {
  return kind === 'numeric' || (op !== 'sum' && op !== 'avg')
}

export function ensureAggregateOp(value: string): AggregateOp {
  if (!AGGREGATE_OPS.includes(value as AggregateOp)) {
    throw new InvalidArgumentError(`The aggregate operation "${value}" is invalid`)
  }
  return value as AggregateOp
}

/** Lo que devuelve el endpoint: `null` cuando no hay dato con el que responder. */
export interface AggregateOutput {
  value: number | null
}

/** Entrada del caso de uso: la operación, el campo y los filtros del listado. */
export interface AggregateInput {
  op: string
  field: string
  filters?: unknown
}
