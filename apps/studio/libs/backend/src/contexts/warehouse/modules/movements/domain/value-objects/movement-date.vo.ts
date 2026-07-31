import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { MovementError } from '../movement-errors'

export class MovementDate extends StringValueObject {
  protected static override fieldName = 'Movement date'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): MovementDate {
    this.ensureIsDefined(value)
    value = this.normalize(value)

    return new MovementDate(value)
  }
}
