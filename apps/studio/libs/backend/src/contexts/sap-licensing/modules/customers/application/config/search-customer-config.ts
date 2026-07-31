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

const searchCustomerConfig = {
  allowedFilters: CUSTOMER_ALLOWED_FILTERS,
  allowedOrders: CUSTOMER_ALLOWED_ORDERS,
  searchableFields: CUSTOMER_SEARCHABLE_FIELDS
} as const

export default searchCustomerConfig
