import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'

export class PasswordHash extends StringValueObject {
  protected static override fieldName = 'Password hash'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): PasswordHash {
    this.ensureIsString(value)
    return new PasswordHash(value)
  }
}
