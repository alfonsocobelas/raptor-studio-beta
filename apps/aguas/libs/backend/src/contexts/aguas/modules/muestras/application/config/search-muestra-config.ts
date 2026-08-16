import { MuestraPrimitiveProps } from '../../domain/muestra-types'

type MuestraAllowedField = keyof MuestraPrimitiveProps

const MUESTRA_ALLOWED_FILTERS: Array<MuestraAllowedField> = ['id', 'codigo', 'estado', 'puntoId', 'puntoName'] as const

const MUESTRA_ALLOWED_ORDERS: Array<MuestraAllowedField> = [
  'codigo',
  'estado',
  'tecnico',
  'recogida',
  'limiteInforme',
  'importe',
  'puntoName'
] as const

const MUESTRA_SEARCHABLE_FIELDS: Array<MuestraAllowedField> = ['codigo', 'puntoName'] as const

const searchMuestraConfig = {
  allowedFilters: MUESTRA_ALLOWED_FILTERS,
  allowedOrders: MUESTRA_ALLOWED_ORDERS,
  searchableFields: MUESTRA_SEARCHABLE_FIELDS
} as const

export default searchMuestraConfig
