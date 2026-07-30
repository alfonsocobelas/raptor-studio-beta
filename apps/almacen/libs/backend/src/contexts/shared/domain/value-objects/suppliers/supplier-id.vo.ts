import { UuidV7ValueObject } from '../uuidv7-value-object'

export class SupplierId extends UuidV7ValueObject {
  protected static override fieldName = 'Supplier ID'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): SupplierId {
    this.ensureIsValidUuidV7(value)
    return new SupplierId(value)
  }
}
