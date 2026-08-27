import type { DraftField, DraftResource } from '@app/shared/domain'

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

  return draft.fields.filter(
    field => field.type !== 'text' && (field.type !== 'string' || field.name === nameField)
  )
}

/** Los campos fecha, que son los únicos sobre los que una ventana temporal tiene sentido. */
export function dateFieldsOf(draft: DraftResource): DraftField[] {
  return draft.fields.filter(field => field.type === 'date')
}

/** Los campos por los que el listado puede ORDENAR: todos menos el texto largo. */
export function sortableFieldsOf(draft: DraftResource): DraftField[] {
  return draft.fields.filter(field => field.type !== 'text')
}

/** Etiquetas de las medidas, en el orden en que se ofrecen. */
export const MEASURE_LABELS: Record<string, string> = {
  count: 'Cuántos hay',
  sum: 'Suma',
  avg: 'Media',
  max: 'Máximo',
  min: 'Mínimo',
  distinct: 'Valores distintos'
}

export const MEASURES = ['count', 'sum', 'avg', 'max', 'min', 'distinct'] as const

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

/** Sumar o promediar fechas no es una pregunta con respuesta (espejo de @raptor/schema). */
export function measureAllowedOn(measure: string, kind: 'numeric' | 'date'): boolean {
  return kind === 'numeric' || (measure !== 'sum' && measure !== 'avg')
}

/** Las medidas que ESTE borrador puede ofrecer: sin campos medibles, solo contar. */
export function measuresFor(draft: DraftResource): string[] {
  const kinds = measurableFieldsOf(draft).map(entry => entry.kind)
  if (!kinds.length) return ['count']

  return MEASURES.filter(
    measure => measure === 'count' || kinds.some(kind => measureAllowedOn(measure, kind))
  ) as unknown as string[]
}
