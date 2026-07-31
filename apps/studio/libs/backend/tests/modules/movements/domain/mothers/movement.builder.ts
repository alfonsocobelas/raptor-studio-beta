import { v7 as uuidv7 } from 'uuid'
import { Movement } from '../../../../../src/contexts/warehouse/modules/movements/domain/movement'
import { MovementPrimitiveProps } from '../../../../../src/contexts/warehouse/modules/movements/domain/movement-types'
import { MovementCounterparty } from '../../../../../src/contexts/warehouse/modules/movements/domain/value-objects/movement-counterparty.vo'
import { MovementDate } from '../../../../../src/contexts/warehouse/modules/movements/domain/value-objects/movement-date.vo'
import { MovementGarmentLabel } from '../../../../../src/contexts/warehouse/modules/movements/domain/value-objects/movement-garment-label.vo'
import { MovementQuantity } from '../../../../../src/contexts/warehouse/modules/movements/domain/value-objects/movement-quantity.vo'
import { MovementReason } from '../../../../../src/contexts/warehouse/modules/movements/domain/value-objects/movement-reason.vo'
import { MovementReference } from '../../../../../src/contexts/warehouse/modules/movements/domain/value-objects/movement-reference.vo'
import { MovementType } from '../../../../../src/contexts/warehouse/modules/movements/domain/value-objects/movement-type.vo'
import { MovementId } from '../../../../../src/contexts/shared/domain/value-objects/movements/movement-id.vo'

const randomReference = (): string => String(Math.floor(1000000000 + Math.random() * 9000000000))

export class MovementBuilder {
  private props: MovementPrimitiveProps = {
    id: uuidv7(),
    reference: randomReference(),
    movementDate: '2026-01-15',
    movementType: 'in',
    garmentLabel: 'GarmentLabel 1',
    quantity: 1,
    counterparty: '',
    reason: 'purchase'
  }

  static aMovement(): MovementBuilder {
    return new MovementBuilder()
  }

  withId(id: string): MovementBuilder {
    this.props.id = id
    return this
  }

  withReference(reference: string): MovementBuilder {
    this.props.reference = reference
    return this
  }

  withMovementType(movementType: string): MovementBuilder {
    this.props.movementType = movementType
    return this
  }

  withReason(reason: string): MovementBuilder {
    this.props.reason = reason
    return this
  }

  withProps(overrides?: Partial<MovementPrimitiveProps>): MovementBuilder {
    this.props = { ...this.props, ...overrides }
    return this
  }

  create(): Movement {
    return Movement.create({
      id: MovementId.create(this.props.id),
      reference: MovementReference.create(this.props.reference),
      movementDate: MovementDate.create(this.props.movementDate),
      movementType: MovementType.create(this.props.movementType),
      garmentLabel: MovementGarmentLabel.create(this.props.garmentLabel),
      quantity: MovementQuantity.create(this.props.quantity),
      counterparty: MovementCounterparty.create(this.props.counterparty),
      reason: MovementReason.create(this.props.reason)
    })
  }

  build(): Movement {
    return Movement.fromPrimitives(this.props)
  }
}
