import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { UserError } from '../auth-errors'
import { UserRoleValue } from '../auth-types'

export class UserRole extends StringValueObject {
  protected static override fieldName = 'User role'
  static readonly VALUES: readonly UserRoleValue[] = ['admin', 'user', 'viewer']

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): UserRole {
    if (!this.VALUES.includes(value as UserRoleValue)) {
      throw new UserError(`User role must be one of: ${this.VALUES.join(', ')}`)
    }
    return new UserRole(value)
  }

  isAdmin(): boolean {
    return this._value === 'admin'
  }
}
