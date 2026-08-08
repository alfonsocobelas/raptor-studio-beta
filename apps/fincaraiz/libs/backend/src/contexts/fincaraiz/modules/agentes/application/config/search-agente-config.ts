import { AgentePrimitiveProps } from '../../domain/agente-types'

type AgenteAllowedField = keyof AgentePrimitiveProps

const AGENTE_ALLOWED_FILTERS: Array<AgenteAllowedField> = ['id', 'nombre'] as const

const AGENTE_ALLOWED_ORDERS: Array<AgenteAllowedField> = [
  'nombre',
  'email',
  'telefono',
  'comisionPorcentaje',
  'activo'
] as const

const AGENTE_SEARCHABLE_FIELDS: Array<AgenteAllowedField> = ['nombre'] as const

const searchAgenteConfig = {
  allowedFilters: AGENTE_ALLOWED_FILTERS,
  allowedOrders: AGENTE_ALLOWED_ORDERS,
  searchableFields: AGENTE_SEARCHABLE_FIELDS
} as const

export default searchAgenteConfig
