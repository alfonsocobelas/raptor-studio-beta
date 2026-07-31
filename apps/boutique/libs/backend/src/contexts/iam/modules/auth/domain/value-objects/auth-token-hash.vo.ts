import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { UserError } from '../auth-errors'

const SHA256_HEX = /^[a-f0-9]{64}$/

export class AuthTokenHash extends StringValueObject {
  protected static override fieldName = 'Auth token hash'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): AuthTokenHash {
    this.ensureIsString(value)
    if (!SHA256_HEX.test(value)) {
      throw new UserError('Auth token hash must be a 64-char lowercase hex string')
    }
    return new AuthTokenHash(value)
  }
}
