import { ClientPrimitiveProps } from '../../domain/client-types'

type ClientAllowedField = keyof ClientPrimitiveProps

const CLIENT_ALLOWED_FILTERS: Array<ClientAllowedField> = ['id', 'name', 'clientType', 'taxId', 'city'] as const

const CLIENT_ALLOWED_ORDERS: Array<ClientAllowedField> = ['name', 'clientType', 'taxId', 'city'] as const

const CLIENT_SEARCHABLE_FIELDS: Array<ClientAllowedField> = [
  'name',
  'taxId',
  'email',
  'phone',
  'city',
  'address'
] as const

const searchClientConfig = {
  allowedFilters: CLIENT_ALLOWED_FILTERS,
  allowedOrders: CLIENT_ALLOWED_ORDERS,
  searchableFields: CLIENT_SEARCHABLE_FIELDS
} as const

export default searchClientConfig
