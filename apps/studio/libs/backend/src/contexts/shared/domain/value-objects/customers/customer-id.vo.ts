import { UuidV7ValueObject } from '../uuidv7-value-object'

export class CustomerId extends UuidV7ValueObject {
  protected static override fieldName = 'Customer ID'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): CustomerId {
    this.ensureIsValidUuidV7(value)
    return new CustomerId(value)
  }
}
