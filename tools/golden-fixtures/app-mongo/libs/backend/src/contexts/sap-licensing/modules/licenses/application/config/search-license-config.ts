import { LicensePrimitiveProps } from '../../domain/license-types'

type LicenseAllowedField = keyof LicensePrimitiveProps

const LICENSE_ALLOWED_FILTERS: Array<LicenseAllowedField> = [
  'id',
  'contractId',
  'customerId',
  'customerName',
  'status',
  'metric',
  'subSolutionAreaName',
  // Columna snapshot (spec 26): habilita el filtro de salud traducido a rango y el filtrado directo.
  'consumptionPct'
] as const

// Allowlist única (spec 26): con el snapshot en columnas, todas las vistas ordenan en SQL.
const LICENSE_ALLOWED_ORDERS: Array<LicenseAllowedField> = [
  'customerName',
  'subSolutionAreaName',
  'licensedUnits',
  'currentUnits',
  'consumptionPct',
  'annualValue',
  'excessUnits',
  'contractEndDate'
] as const

// Free-text columns shown in the table (spec 25). The SQL path ORs them with ILIKE; the health
// path applies the same fields in memory (see filter-licenses-by-search.ts).
const LICENSE_SEARCHABLE_FIELDS: Array<LicenseAllowedField> = ['customerName', 'subSolutionAreaName', 'metric'] as const

// Lo que el endpoint `aggregate` puede tocar (spec 71). El nombre del campo llega por HTTP y
// termina dentro de la consulta: solo se agrega lo que esta lista declara, y su tipo decide qué
// operaciones son legales (sumar fechas no es una pregunta con respuesta).
const LICENSE_AGGREGATABLE_FIELDS = {
  contractEndDate: 'date',
  licensedUnits: 'numeric',
  pricePerUnit: 'numeric',
  archivedAt: 'date',
  lastSeenInSyncAt: 'date',
  currentUnits: 'numeric',
  consumptionPct: 'numeric',
  excessUnits: 'numeric',
  annualValue: 'numeric'
} as const satisfies Partial<Record<LicenseAllowedField, 'numeric' | 'date'>>

// Por qué campos se puede AGRUPAR un desglose (spec 72). NO es la lista de agregables: agrupar por
// un importe daría un grupo por fila. Enums, referencias y booleanos, y solo si la API los filtra.
const LICENSE_GROUPABLE_FIELDS: Array<LicenseAllowedField> = ['contractId', 'customerId', 'metric', 'status'] as const

const searchLicenseConfig = {
  allowedFilters: LICENSE_ALLOWED_FILTERS,
  allowedOrders: LICENSE_ALLOWED_ORDERS,
  searchableFields: LICENSE_SEARCHABLE_FIELDS,
  aggregatableFields: LICENSE_AGGREGATABLE_FIELDS,
  groupableFields: LICENSE_GROUPABLE_FIELDS
} as const

export default searchLicenseConfig
