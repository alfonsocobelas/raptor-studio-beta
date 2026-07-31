import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { UserError } from '../auth-errors'
import { UserStatusValue } from '../auth-types'

export class UserStatus extends StringValueObject {
  protected static override fieldName = 'User status'
  static readonly VALUES: readonly UserStatusValue[] = ['pending', 'active', 'disabled']

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): UserStatus {
    if (!this.VALUES.includes(value as UserStatusValue)) {
      throw new UserError(`User status must be one of: ${this.VALUES.join(', ')}`)
    }
    return new UserStatus(value)
  }

  isPending(): boolean {
    return this._value === 'pending'
  }

  isActive(): boolean {
    return this._value === 'active'
  }

  isDisabled(): boolean {
    return this._value === 'disabled'
  }
}
