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

const searchProjectConfig = {
  allowedFilters: PROJECT_ALLOWED_FILTERS,
  allowedOrders: PROJECT_ALLOWED_ORDERS,
  searchableFields: PROJECT_SEARCHABLE_FIELDS
} as const

export default searchProjectConfig
