import { AggregateRoot } from '../../../../shared/domain/aggregate-root'
import { Nullable, Undefinable } from '../../../../shared/domain/types'
import { MovementId } from '../../../../shared/domain/value-objects/movements/movement-id.vo'
import {
  MovementAggregateProps,
  MovementPrimitiveProps,
  MovementUniquenessUpdateProps,
  MovementUpdateProps,
  RegisterMovementProps
} from './movement-types'
import { MovementCounterparty } from './value-objects/movement-counterparty.vo'
import { MovementDate } from './value-objects/movement-date.vo'
import { MovementGarmentLabel } from './value-objects/movement-garment-label.vo'
import { MovementQuantity } from './value-objects/movement-quantity.vo'
import { MovementReason } from './value-objects/movement-reason.vo'
import { MovementReference } from './value-objects/movement-reference.vo'
import { MovementType } from './value-objects/movement-type.vo'

export class Movement extends AggregateRoot {
  private constructor(
    private readonly _id: MovementId,
    private _reference: MovementReference,
    private _movementDate: MovementDate,
    private _movementType: MovementType,
    private _garmentLabel: MovementGarmentLabel,
    private _quantity: MovementQuantity,
    private _counterparty: MovementCounterparty,
    private _reason: MovementReason
  ) {
    super()
  }

  //#region ...Getters...
  get id(): MovementId {
    return this._id
  }
  get reference(): MovementReference {
    return this._reference
  }
  get movementDate(): MovementDate {
    return this._movementDate
  }
  get movementType(): MovementType {
    return this._movementType
  }
  get garmentLabel(): MovementGarmentLabel {
    return this._garmentLabel
  }
  get quantity(): MovementQuantity {
    return this._quantity
  }
  get counterparty(): MovementCounterparty {
    return this._counterparty
  }
  get reason(): MovementReason {
    return this._reason
  }
  //#endregion

  static create(props: MovementAggregateProps): Movement {
    return new Movement(
      props.id,
      props.reference,
      props.movementDate,
      props.movementType,
      props.garmentLabel,
      props.quantity,
      props.counterparty,
      props.reason
    )
  }

  static register(props: RegisterMovementProps): Movement {
    return Movement.create({
      id: MovementId.create(props.id),
      reference: MovementReference.create(props.reference),
      movementDate: MovementDate.create(props.movementDate),
      movementType: MovementType.create(props.movementType),
      garmentLabel: MovementGarmentLabel.create(props.garmentLabel),
      quantity: MovementQuantity.create(props.quantity),
      counterparty: MovementCounterparty.create(props.counterparty ?? ''),
      reason: MovementReason.create(props.reason)
    })
  }

  static fromPrimitives(props: MovementPrimitiveProps): Movement {
    return new Movement(
      MovementId.create(props.id),
      MovementReference.create(props.reference),
      MovementDate.create(props.movementDate),
      MovementType.create(props.movementType),
      MovementGarmentLabel.create(props.garmentLabel),
      MovementQuantity.create(props.quantity),
      MovementCounterparty.create(props.counterparty),
      MovementReason.create(props.reason)
    )
  }

  toPrimitives(): MovementPrimitiveProps {
    return {
      id: this._id.value,
      reference: this._reference.value,
      movementDate: this._movementDate.value,
      movementType: this._movementType.value,
      garmentLabel: this._garmentLabel.value,
      quantity: this._quantity.value,
      counterparty: this._counterparty.value,
      reason: this._reason.value
    }
  }

  updateDetails(updates: MovementUpdateProps): void {
    if (updates.reference !== undefined) {
      this._reference = MovementReference.create(updates.reference)
    }
    if (updates.movementDate !== undefined) {
      this._movementDate = MovementDate.create(updates.movementDate)
    }
    if (updates.movementType !== undefined) {
      this._movementType = MovementType.create(updates.movementType)
    }
    if (updates.garmentLabel !== undefined) {
      this._garmentLabel = MovementGarmentLabel.create(updates.garmentLabel)
    }
    if (updates.quantity !== undefined) {
      this._quantity = MovementQuantity.create(updates.quantity)
    }
    if (updates.counterparty !== undefined) {
      this._counterparty = MovementCounterparty.create(updates.counterparty)
    }
    if (updates.reason !== undefined) {
      this._reason = MovementReason.create(updates.reason)
    }
  }

  equals(other: AggregateRoot): boolean {
    if (!(other instanceof Movement)) {
      return false
    }
    return this._id.equals(other._id)
  }

  newReferenceIfChanged(updates: MovementUniquenessUpdateProps): Undefinable<MovementReference> {
    if (!updates.reference) {
      return
    }

    const newReference = MovementReference.create(updates.reference)

    if (this._reference.equals(newReference)) {
      return
    }

    return newReference
  }

  // @ai:begin domain-extra — métodos de negocio no derivables del schema
  // @ai:end
}
