import { InvalidArgumentError } from '../errors'

/**
 * Agregaciones que la API sabe responder (spec 71). Ni una más: cada una tiene que ser expresable
 * en LOS DOS motores de persistencia, y los percentiles y las medianas no lo son de forma portable.
 */
export const AGGREGATE_OPS = ['count', 'sum', 'avg', 'min', 'max', 'distinct'] as const

export type AggregateOp = (typeof AGGREGATE_OPS)[number]

/** Tipos de campo agregables; los declara la config de cada recurso. */
export type AggregateFieldKind = 'numeric' | 'date'

/** Sumar o promediar fechas no es una pregunta con respuesta. El resto de operaciones sí. */
export function opAllowedOn(op: AggregateOp, kind: AggregateFieldKind): boolean {
  if (op === 'count') return true
  return kind === 'numeric' || (op !== 'sum' && op !== 'avg')
}

/** `count` cuenta FILAS: no mide ninguna columna y no lleva campo (spec 72). */
export function opNeedsField(op: AggregateOp): boolean {
  return op !== 'count'
}

export function ensureAggregateOp(value: string): AggregateOp {
  if (!AGGREGATE_OPS.includes(value as AggregateOp)) {
    throw new InvalidArgumentError(`The aggregate operation "${value}" is invalid`)
  }
  return value as AggregateOp
}

/** Un grupo del desglose: su clave legible y su valor. */
export interface AggregateGroup {
  key: string
  value: number | null
}

/**
 * Lo que devuelve el endpoint (spec 72). UNA forma, no dos: `value` es el valor sobre todo el
 * conjunto filtrado y siempre viaja; `groups` solo cuando se pidió agrupar. Tener el total en la
 * misma respuesta es justo lo que la barra de un desglose necesita para su porcentaje.
 */
export interface AggregateOutput {
  value: number | null
  groups?: AggregateGroup[]
  /** El desglose venía RECORTADO por el techo de grupos: no es «esto es todo» */
  truncated?: boolean
}

/** Máximo de grupos que se devuelven. Un desglose por un campo de alta cardinalidad no se dibuja. */
export const AGGREGATE_GROUP_LIMIT = 50

/** Entrada del caso de uso: la operación, el campo, el eje de agrupación y los filtros. */
export interface AggregateInput {
  op: string
  field?: string
  /** Campo por el que desglosar; excluyente con `bucket` */
  groupBy?: string
  /** Único bucket soportado hoy: por mes */
  bucket?: string
  /** Campo fecha sobre el que se hacen los meses */
  bucketField?: string
  /** Cuántos meses hacia atrás, contando el actual */
  months?: number
  filters?: unknown
}

/** Lo que el repositorio necesita para agrupar; ya validado por el caso de uso. */
export interface GroupedSpec {
  op: AggregateOp
  field?: string
  groupBy?: string
  bucketField?: string
  limit: number
}
