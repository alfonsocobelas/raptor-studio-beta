import { UuidV7ValueObject } from '../uuidv7-value-object'

export class LicenseId extends UuidV7ValueObject {
  protected static override fieldName = 'License ID'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): LicenseId {
    this.ensureIsValidUuidV7(value)
    return new LicenseId(value)
  }
}
