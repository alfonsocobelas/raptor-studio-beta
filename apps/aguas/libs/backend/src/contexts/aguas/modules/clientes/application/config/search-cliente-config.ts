import { ClientePrimitiveProps } from '../../domain/cliente-types'

type ClienteAllowedField = keyof ClientePrimitiveProps

const CLIENTE_ALLOWED_FILTERS: Array<ClienteAllowedField> = ['id', 'nombre', 'tipo'] as const

const CLIENTE_ALLOWED_ORDERS: Array<ClienteAllowedField> = ['nombre', 'tipo', 'telefono', 'localidad'] as const

const CLIENTE_SEARCHABLE_FIELDS: Array<ClienteAllowedField> = ['nombre'] as const

const searchClienteConfig = {
  allowedFilters: CLIENTE_ALLOWED_FILTERS,
  allowedOrders: CLIENTE_ALLOWED_ORDERS,
  searchableFields: CLIENTE_SEARCHABLE_FIELDS
} as const

export default searchClienteConfig
