import { ProjectPrimitiveProps } from '../../domain/project-types'

type ProjectAllowedField = keyof ProjectPrimitiveProps

const PROJECT_ALLOWED_FILTERS: Array<ProjectAllowedField> = [
  'id',
  'status',
  'implementer',
  'customerId',
  'customerName',
  'name',
  'origin'
] as const

const PROJECT_ALLOWED_ORDERS: Array<ProjectAllowedField> = [
  'name',
  'customerName',
  'startDate',
  'endDate',
  'status'
] as const

// Free-text columns shown in the table (spec 25: status/implementer are badges, dates are out).
const PROJECT_SEARCHABLE_FIELDS: Array<ProjectAllowedField> = ['name', 'customerName'] as const

// Lo que el endpoint `aggregate` puede tocar (spec 71). El nombre del campo llega por HTTP y
// termina dentro de la consulta: solo se agrega lo que esta lista declara, y su tipo decide qué
// operaciones son legales (sumar fechas no es una pregunta con respuesta).
const PROJECT_AGGREGATABLE_FIELDS = {
  startDate: 'date',
  endDate: 'date',
  archivedAt: 'date',
  lastSeenInSyncAt: 'date',
  nbrOfWaves: 'numeric',
  planToGoLive: 'date'
} as const satisfies Partial<Record<ProjectAllowedField, 'numeric' | 'date'>>

// Por qué campos se puede AGRUPAR un desglose (spec 72). NO es la lista de agregables: agrupar por
// un importe daría un grupo por fila. Enums, referencias y booleanos, y solo si la API los filtra.
const PROJECT_GROUPABLE_FIELDS: Array<ProjectAllowedField> = ['customerId', 'status', 'implementer', 'origin'] as const

const searchProjectConfig = {
  allowedFilters: PROJECT_ALLOWED_FILTERS,
  allowedOrders: PROJECT_ALLOWED_ORDERS,
  searchableFields: PROJECT_SEARCHABLE_FIELDS,
  aggregatableFields: PROJECT_AGGREGATABLE_FIELDS,
  groupableFields: PROJECT_GROUPABLE_FIELDS
} as const

export default searchProjectConfig
