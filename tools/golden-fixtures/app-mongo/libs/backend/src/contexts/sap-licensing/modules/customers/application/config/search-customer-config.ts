import { CustomerPrimitiveProps } from '../../domain/customer-types'

type CustomerAllowedField = keyof CustomerPrimitiveProps

const CUSTOMER_ALLOWED_FILTERS: Array<CustomerAllowedField> = [
  'id',
  'sapId',
  'name',
  'taxId',
  'industry',
  'customerType'
] as const

const CUSTOMER_ALLOWED_ORDERS: Array<CustomerAllowedField> = [
  'name',
  'sapId',
  'taxId',
  'industry',
  'city',
  'country',
  'customerType'
] as const

const CUSTOMER_SEARCHABLE_FIELDS: Array<CustomerAllowedField> = [
  'name',
  'industry',
  'taxId',
  'address',
  'phone',
  'city',
  'country'
] as const

// Lo que el endpoint `aggregate` puede tocar (spec 71). El nombre del campo llega por HTTP y
// termina dentro de la consulta: solo se agrega lo que esta lista declara, y su tipo decide qué
// operaciones son legales (sumar fechas no es una pregunta con respuesta).
const CUSTOMER_AGGREGATABLE_FIELDS = {
  archivedAt: 'date',
  lastSeenInSyncAt: 'date'
} as const satisfies Partial<Record<CustomerAllowedField, 'numeric' | 'date'>>

const searchCustomerConfig = {
  allowedFilters: CUSTOMER_ALLOWED_FILTERS,
  allowedOrders: CUSTOMER_ALLOWED_ORDERS,
  searchableFields: CUSTOMER_SEARCHABLE_FIELDS,
  aggregatableFields: CUSTOMER_AGGREGATABLE_FIELDS
} as const

export default searchCustomerConfig
