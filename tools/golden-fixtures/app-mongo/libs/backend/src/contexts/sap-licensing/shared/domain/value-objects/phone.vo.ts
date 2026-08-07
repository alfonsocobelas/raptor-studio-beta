import { InvalidArgumentError } from '../../../../shared/domain/errors'
import { StringValueObject } from '../../../../shared/domain/value-objects/string-value-object'
import { SHARED_CONSTRAINTS } from '../constants'

export class Phone extends StringValueObject {
  protected static override fieldName = 'Phone'

  private static readonly ALLOWED = /^[0-9+()\-/.\s]+$/

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): Phone {
    this.ensureIsDefined(value)
    value = this.normalize(value)

    if (value.length > SHARED_CONSTRAINTS.PHONE.MAX) {
      throw new InvalidArgumentError(`Phone must be at most ${SHARED_CONSTRAINTS.PHONE.MAX} characters`)
    }

    if (value.length > 0 && !this.ALLOWED.test(value)) {
      throw new InvalidArgumentError('Phone may only contain digits and the symbols + ( ) - / . and spaces')
    }

    return new Phone(value)
  }

  protected static override normalize(value: string): string {
    return value.trim().replace(/\s+/g, ' ')
  }
}
