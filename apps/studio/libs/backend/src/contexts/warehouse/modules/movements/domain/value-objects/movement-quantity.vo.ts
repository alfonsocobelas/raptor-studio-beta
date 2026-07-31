import { IntegerValueObject } from '../../../../../shared/domain/value-objects/integer-value-object'
import { MOVEMENT_CONSTRAINTS } from '../movement-constants'
import { MovementError } from '../movement-errors'

export class MovementQuantity extends IntegerValueObject {
  protected static override fieldName = 'Movement quantity'

  private constructor(value: number) {
    super(value)
  }

  static create(value: number): MovementQuantity {
    this.ensureIsInteger(value)

    if (value < MOVEMENT_CONSTRAINTS.QUANTITY.MIN) {
      throw new MovementError(`Movement quantity must be at least ${MOVEMENT_CONSTRAINTS.QUANTITY.MIN}`)
    }

    return new MovementQuantity(value)
  }
}
