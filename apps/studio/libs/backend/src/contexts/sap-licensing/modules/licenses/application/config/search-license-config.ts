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

const searchLicenseConfig = {
  allowedFilters: LICENSE_ALLOWED_FILTERS,
  allowedOrders: LICENSE_ALLOWED_ORDERS,
  searchableFields: LICENSE_SEARCHABLE_FIELDS
} as const

export default searchLicenseConfig
