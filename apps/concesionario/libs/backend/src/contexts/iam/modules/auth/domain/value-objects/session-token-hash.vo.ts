import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { UserError } from '../auth-errors'

const SHA256_HEX = /^[a-f0-9]{64}$/

export class SessionTokenHash extends StringValueObject {
  protected static override fieldName = 'Session token hash'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): SessionTokenHash {
    this.ensureIsString(value)
    if (!SHA256_HEX.test(value)) {
      throw new UserError('Session token hash must be a 64-char lowercase hex string')
    }
    return new SessionTokenHash(value)
  }
}
