import { InvalidArgumentError } from '../../../../../shared/domain/errors'
import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { AUTH_CONSTRAINTS } from '../auth-constants'
import { UserError } from '../auth-errors'

export class PlainPassword extends StringValueObject {
  protected static override fieldName = 'Password'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): PlainPassword {
    if (value === null || value === undefined || value.length === 0) {
      throw new InvalidArgumentError(`${this.fieldName} cannot be empty`)
    }
    if (value.length < AUTH_CONSTRAINTS.PASSWORD.MIN) {
      throw new UserError(`Password must be at least ${AUTH_CONSTRAINTS.PASSWORD.MIN} characters`)
    }
    if (value.length > AUTH_CONSTRAINTS.PASSWORD.MAX) {
      throw new UserError(`Password must be at most ${AUTH_CONSTRAINTS.PASSWORD.MAX} characters`)
    }
    return new PlainPassword(value)
  }
}
