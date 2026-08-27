import type { KpiOperator } from './app-types'
import type { FieldDefinition } from './resource-types'

/** Control con el que el panel pide el valor de la condición. */
export type KpiValueControl = 'select' | 'boolean' | 'number' | 'date' | 'text'

const EQUALITY: KpiOperator[] = ['eq', 'neq']
const ORDER: KpiOperator[] = ['eq', 'neq', 'gt', 'gte', 'lt', 'lte']
const SUBSTRING: KpiOperator[] = ['eq', 'neq', 'contains', 'starts_with', 'ends_with']

/** Un campo con `vo.values` es un enum, aunque su tipo persistido sea string. */
function isEnum(field: FieldDefinition): boolean {
  return typeof field.vo === 'object' && Array.isArray(field.vo.values) && field.vo.values.length > 0
}

/**
 * Los operadores que este campo admite en la condición de un KPI (spec 70). Fuente ÚNICA para el
 * panel del estudio y para la composición del generador: dos listas serían dos listas que
 * divergen, y la divergencia acaba en un KPI que la API no sabe resolver.
 *
 * Un enum no ofrece `contains`: es legal en la API y casi siempre un error de diseño (`contains
 * 'act'` casaría 'active' e 'inactive').
 */
export function operatorsFor(field: FieldDefinition): KpiOperator[] {
  if (isEnum(field)) return EQUALITY
  if (field.type === 'boolean' || field.type === 'uuid') return EQUALITY
  if (field.type === 'number' || field.type === 'integer') return ORDER
  if (field.type === 'date' || field.type === 'timestamptz') return ORDER

  return SUBSTRING
}

export function valueControlFor(field: FieldDefinition): KpiValueControl {
  if (isEnum(field)) return 'select'
  if (field.type === 'boolean') return 'boolean'
  if (field.type === 'number' || field.type === 'integer') return 'number'
  if (field.type === 'date' || field.type === 'timestamptz') return 'date'

  return 'text'
}
