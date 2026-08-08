import { VisitaPrimitiveProps } from '../../domain/visita-types'

type VisitaAllowedField = keyof VisitaPrimitiveProps

const VISITA_ALLOWED_FILTERS: Array<VisitaAllowedField> = ['id', 'referencia', 'propiedadId', 'propiedadName'] as const

const VISITA_ALLOWED_ORDERS: Array<VisitaAllowedField> = [
  'referencia',
  'fecha',
  'interesado',
  'observaciones',
  'confirmada',
  'propiedadName'
] as const

const VISITA_SEARCHABLE_FIELDS: Array<VisitaAllowedField> = ['referencia', 'propiedadName'] as const

const searchVisitaConfig = {
  allowedFilters: VISITA_ALLOWED_FILTERS,
  allowedOrders: VISITA_ALLOWED_ORDERS,
  searchableFields: VISITA_SEARCHABLE_FIELDS
} as const

export default searchVisitaConfig
