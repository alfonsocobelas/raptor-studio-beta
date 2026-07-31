import { Nullable } from '../../../../shared/domain/types'
import { MovementId } from '../../../../shared/domain/value-objects/movements/movement-id.vo'
import { MovementCounterparty } from './value-objects/movement-counterparty.vo'
import { MovementDate } from './value-objects/movement-date.vo'
import { MovementGarmentLabel } from './value-objects/movement-garment-label.vo'
import { MovementQuantity } from './value-objects/movement-quantity.vo'
import { MovementReason } from './value-objects/movement-reason.vo'
import { MovementReference } from './value-objects/movement-reference.vo'
import { MovementType } from './value-objects/movement-type.vo'

export interface MovementAggregateProps {
  id: MovementId
  reference: MovementReference
  movementDate: MovementDate
  movementType: MovementType
  garmentLabel: MovementGarmentLabel
  quantity: MovementQuantity
  counterparty: MovementCounterparty
  reason: MovementReason
}

export interface MovementPrimitiveProps {
  id: string
  reference: string
  movementDate: string
  movementType: string
  garmentLabel: string
  quantity: number
  counterparty: string
  reason: string
}

export type MovementUpdateProps = Partial<Omit<MovementPrimitiveProps, 'id'>>

export type MovementUniquenessUpdateProps = Pick<MovementUpdateProps, 'reference'>

export interface RegisterMovementProps {
  id: string
  reference: string
  movementDate: string
  movementType: string
  garmentLabel: string
  quantity: number
  counterparty?: string
  reason: string
}
