import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { AUTH_CONSTRAINTS } from '../auth-constants'
import { UserError } from '../auth-errors'

export class UserName extends StringValueObject {
  protected static override fieldName = 'User name'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): UserName {
    this.ensureIsString(value)
    const trimmed = value.trim()
    if (trimmed.length > AUTH_CONSTRAINTS.NAME.MAX) {
      throw new UserError(`User name must be at most ${AUTH_CONSTRAINTS.NAME.MAX} characters`)
    }
    return new UserName(trimmed)
  }
}
