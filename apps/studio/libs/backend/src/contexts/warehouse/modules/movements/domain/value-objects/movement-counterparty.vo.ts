import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { MOVEMENT_CONSTRAINTS } from '../movement-constants'
import { MovementError } from '../movement-errors'

export class MovementCounterparty extends StringValueObject {
  protected static override fieldName = 'Movement counterparty'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): MovementCounterparty {
    this.ensureIsDefined(value)
    value = this.normalize(value)

    if (value.length > MOVEMENT_CONSTRAINTS.COUNTERPARTY.MAX) {
      throw new MovementError(
        `Movement counterparty must be at most ${MOVEMENT_CONSTRAINTS.COUNTERPARTY.MAX} characters`
      )
    }

    return new MovementCounterparty(value)
  }
}
