import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { MOVEMENT_CONSTRAINTS } from '../movement-constants'
import { MovementError } from '../movement-errors'

export class MovementReference extends StringValueObject {
  protected static override fieldName = 'Movement reference'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): MovementReference {
    this.ensureIsString(value)
    value = this.normalize(value)
    this.ensureHasNoInnerWhitespace(value)

    if (value.length < MOVEMENT_CONSTRAINTS.REFERENCE.MIN) {
      throw new MovementError(`Movement reference must be at least ${MOVEMENT_CONSTRAINTS.REFERENCE.MIN} characters`)
    }

    if (value.length > MOVEMENT_CONSTRAINTS.REFERENCE.MAX) {
      throw new MovementError(`Movement reference must be at most ${MOVEMENT_CONSTRAINTS.REFERENCE.MAX} characters`)
    }

    return new MovementReference(value)
  }
}
