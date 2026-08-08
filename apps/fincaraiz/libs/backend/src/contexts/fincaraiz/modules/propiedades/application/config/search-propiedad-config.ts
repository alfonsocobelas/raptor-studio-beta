import { PropiedadPrimitiveProps } from '../../domain/propiedad-types'

type PropiedadAllowedField = keyof PropiedadPrimitiveProps

const PROPIEDAD_ALLOWED_FILTERS: Array<PropiedadAllowedField> = [
  'id',
  'titulo',
  'estado',
  'agenteId',
  'agenteName'
] as const

const PROPIEDAD_ALLOWED_ORDERS: Array<PropiedadAllowedField> = [
  'titulo',
  'zona',
  'estado',
  'metrosCuadrados',
  'habitaciones',
  'precio',
  'fechaAlta',
  'exclusiva',
  'agenteName'
] as const

const PROPIEDAD_SEARCHABLE_FIELDS: Array<PropiedadAllowedField> = ['titulo', 'agenteName'] as const

const searchPropiedadConfig = {
  allowedFilters: PROPIEDAD_ALLOWED_FILTERS,
  allowedOrders: PROPIEDAD_ALLOWED_ORDERS,
  searchableFields: PROPIEDAD_SEARCHABLE_FIELDS
} as const

export default searchPropiedadConfig
