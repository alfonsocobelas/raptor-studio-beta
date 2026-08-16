import { ParametroPrimitiveProps } from '../../domain/parametro-types'

type ParametroAllowedField = keyof ParametroPrimitiveProps

const PARAMETRO_ALLOWED_FILTERS: Array<ParametroAllowedField> = ['id', 'codigo'] as const

const PARAMETRO_ALLOWED_ORDERS: Array<ParametroAllowedField> = [
  'codigo',
  'nombre',
  'metodo',
  'limiteLegal',
  'precio'
] as const

const PARAMETRO_SEARCHABLE_FIELDS: Array<ParametroAllowedField> = ['codigo'] as const

const searchParametroConfig = {
  allowedFilters: PARAMETRO_ALLOWED_FILTERS,
  allowedOrders: PARAMETRO_ALLOWED_ORDERS,
  searchableFields: PARAMETRO_SEARCHABLE_FIELDS
} as const

export default searchParametroConfig
