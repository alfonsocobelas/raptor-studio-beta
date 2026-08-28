import { AGGREGATE_OPS, opAllowedOn, type AggregateOp } from '@raptor/schema'
import type { DesignBlock, DraftField, DraftResource, KpiCell, KpiCellKind } from '@app/shared/domain'

/** Etiquetas de las ventanas temporales; el orden es el que ve el panel. */
export const WINDOW_PRESET_LABELS: Record<string, string> = {
  today: 'Hoy',
  week: 'Esta semana',
  month: 'Este mes',
  quarter: 'Este trimestre',
  year: 'Este año',
  days: 'Últimos N días'
}

export const WINDOW_PRESETS = ['today', 'week', 'month', 'quarter', 'year', 'days'] as const

/** Etiquetas de los operadores tal como se leen en el panel. */
export const OPERATOR_LABELS: Record<string, string> = {
  eq: 'es igual a',
  neq: 'no es',
  gt: 'mayor que',
  gte: 'mayor o igual',
  lt: 'menor que',
  lte: 'menor o igual',
  contains: 'contiene',
  starts_with: 'empieza por',
  ends_with: 'acaba en'
}

/**
 * Los operadores que el panel ofrece para un campo del BORRADOR (spec 70). Es el espejo de
 * `operatorsFor` de @raptor/schema, sobre los tipos del estudio: el borrador todavía no es un
 * ResourceDefinition cuando el usuario está configurando la tarjeta.
 */
export function draftOperatorsFor(field: DraftField): string[] {
  if (field.type === 'enum' || field.type === 'boolean' || field.type === 'ref' || field.type === 'uuid') {
    return ['eq', 'neq']
  }
  if (field.type === 'number' || field.type === 'integer' || field.type === 'date' || field.type === 'time') {
    return ['eq', 'neq', 'gt', 'gte', 'lt', 'lte']
  }
  return ['eq', 'neq', 'contains', 'starts_with', 'ends_with']
}

/** Con qué control se pide el valor de la condición. */
export function draftValueControlFor(field: DraftField): 'select' | 'boolean' | 'number' | 'date' | 'text' {
  if (field.type === 'enum') return 'select'
  if (field.type === 'boolean') return 'boolean'
  if (field.type === 'number' || field.type === 'integer') return 'number'
  if (field.type === 'date') return 'date'
  return 'text'
}

/**
 * Los campos por los que ESTE borrador puede condicionar un KPI: los que el listado emitido
 * sabe filtrar (spec 70). Un enum, una referencia, el campo nombre, y las fechas, números y
 * booleanos que la spec 70 hizo filtrables. El texto largo no: para eso está la búsqueda.
 */
export function conditionFieldsOf(draft: DraftResource): DraftField[] {
  // el «nombre» del recurso es el PRIMER string del borrador: es el único string filtrable
  // (draft-resource.ts), así que el resto no puede condicionar nada
  const nameField = draft.fields.find(field => field.type === 'string')?.name

  return draft.fields.filter(field => field.type !== 'text' && (field.type !== 'string' || field.name === nameField))
}

/** Los campos fecha, que son los únicos sobre los que una ventana temporal tiene sentido. */
export function dateFieldsOf(draft: DraftResource): DraftField[] {
  return draft.fields.filter(field => field.type === 'date')
}

/** Los campos por los que el listado puede ORDENAR: todos menos el texto largo. */
export function sortableFieldsOf(draft: DraftResource): DraftField[] {
  return draft.fields.filter(field => field.type !== 'text')
}

/** Etiquetas de las medidas; el ORDEN y el catálogo los manda el schema, aquí solo el texto. */
export const MEASURE_LABELS: Record<string, string> = {
  count: 'Cuántos hay',
  sum: 'Suma',
  avg: 'Media',
  min: 'Mínimo',
  max: 'Máximo',
  distinct: 'Valores distintos'
}

/**
 * Los campos que se pueden MEDIR (spec 71) y con qué tipo. Solo números y fechas: el texto y los
 * enums no tienen suma que dar, y un booleano es una condición del conteo, no una medida.
 */
export function measurableFieldsOf(draft: DraftResource): { field: DraftField; kind: 'numeric' | 'date' }[] {
  return draft.fields
    .map(field => {
      if (field.type === 'number' || field.type === 'integer') return { field, kind: 'numeric' as const }
      if (field.type === 'date') return { field, kind: 'date' as const }
      return null
    })
    .filter((entry): entry is { field: DraftField; kind: 'numeric' | 'date' } => entry !== null)
}

/** La regla es DEL SCHEMA: el estudio solo la re-exporta con el nombre que sus paneles usan.
 *  La copia local ya había derivado (el orden min/max no coincidía con el catálogo). */
export function measureAllowedOn(measure: string, kind: 'numeric' | 'date'): boolean {
  return opAllowedOn(measure as AggregateOp, kind)
}

/** Las medidas que ESTE borrador puede ofrecer: sin campos medibles, solo contar. */
export function measuresFor(draft: DraftResource): string[] {
  const kinds = measurableFieldsOf(draft).map(entry => entry.kind)
  if (!kinds.length) return ['count']

  return ['count', ...AGGREGATE_OPS.filter(op => op !== 'count' && kinds.some(kind => opAllowedOn(op, kind)))]
}

/**
 * El campo medido tras cambiar la medida: se conserva si el nuevo tipo lo admite y, si no, el
 * primero que sí. Estaba copiado byte a byte en los dos paneles (tarjeta y gráficos) — la clase
 * de espejo que este proyecto ya vio derivar tres veces.
 */
export function nextMeasureField(draft: DraftResource, measure: string, current?: string): string | undefined {
  if (measure === 'count') return undefined
  const measurable = measurableFieldsOf(draft).filter(entry => measureAllowedOn(measure, entry.kind))
  const keeps = measurable.some(entry => entry.field.name === current)
  return keeps ? current : measurable[0]?.field.name
}

/**
 * Localiza en la vista la PRIMERA celda de estos tipos que hable de la entidad elegida
 * (spec 73): es como los paneles de config encuentran su celda dentro de las filas de KPIs,
 * igual que antes encontraban su bloque suelto.
 */
export function cellAt(
  blocks: DesignBlock[],
  kinds: KpiCellKind[],
  resource: string | null
): { blockIndex: number; cellIndex: number; cell: KpiCell } | null {
  for (let blockIndex = 0; blockIndex < blocks.length; blockIndex++) {
    const items = blocks[blockIndex].items ?? []
    const cellIndex = items.findIndex(cell => kinds.includes(cell.kind) && cell.resource === resource)
    if (cellIndex >= 0) return { blockIndex, cellIndex, cell: items[cellIndex] }
  }
  return null
}
