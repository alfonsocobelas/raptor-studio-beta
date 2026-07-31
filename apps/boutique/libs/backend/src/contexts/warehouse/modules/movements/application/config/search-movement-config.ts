import { MovementPrimitiveProps } from '../../domain/movement-types'

type MovementAllowedField = keyof MovementPrimitiveProps

const MOVEMENT_ALLOWED_FILTERS: Array<MovementAllowedField> = [
  'id',
  'reference',
  'movementDate',
  'movementType',
  'reason'
] as const

const MOVEMENT_ALLOWED_ORDERS: Array<MovementAllowedField> = [
  'movementDate',
  'reference',
  'movementType',
  'garmentLabel',
  'quantity'
] as const

const MOVEMENT_SEARCHABLE_FIELDS: Array<MovementAllowedField> = ['reference', 'garmentLabel', 'counterparty'] as const

const searchMovementConfig = {
  allowedFilters: MOVEMENT_ALLOWED_FILTERS,
  allowedOrders: MOVEMENT_ALLOWED_ORDERS,
  searchableFields: MOVEMENT_SEARCHABLE_FIELDS
} as const

export default searchMovementConfig
