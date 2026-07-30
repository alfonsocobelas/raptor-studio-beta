import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { UserError } from '../auth-errors'
import { AuthTokenTypeValue } from '../auth-types'

export class AuthTokenType extends StringValueObject {
  protected static override fieldName = 'Auth token type'
  static readonly VALUES: readonly AuthTokenTypeValue[] = ['invitation', 'password_reset']

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): AuthTokenType {
    if (!this.VALUES.includes(value as AuthTokenTypeValue)) {
      throw new UserError(`Auth token type must be one of: ${this.VALUES.join(', ')}`)
    }
    return new AuthTokenType(value)
  }

  isInvitation(): boolean {
    return this._value === 'invitation'
  }

  isPasswordReset(): boolean {
    return this._value === 'password_reset'
  }
}
