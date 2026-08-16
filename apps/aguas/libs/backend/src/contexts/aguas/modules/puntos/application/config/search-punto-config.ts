import { PuntoPrimitiveProps } from '../../domain/punto-types'

type PuntoAllowedField = keyof PuntoPrimitiveProps

const PUNTO_ALLOWED_FILTERS: Array<PuntoAllowedField> = [
  'id',
  'nombre',
  'tipoAgua',
  'clienteId',
  'clienteName'
] as const

const PUNTO_ALLOWED_ORDERS: Array<PuntoAllowedField> = [
  'nombre',
  'tipoAgua',
  'direccion',
  'coordenadas',
  'obligatorio',
  'clienteName'
] as const

const PUNTO_SEARCHABLE_FIELDS: Array<PuntoAllowedField> = ['nombre', 'clienteName'] as const

const searchPuntoConfig = {
  allowedFilters: PUNTO_ALLOWED_FILTERS,
  allowedOrders: PUNTO_ALLOWED_ORDERS,
  searchableFields: PUNTO_SEARCHABLE_FIELDS
} as const

export default searchPuntoConfig
