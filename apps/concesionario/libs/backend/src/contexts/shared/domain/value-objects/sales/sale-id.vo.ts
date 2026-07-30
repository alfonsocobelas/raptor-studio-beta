import { UuidV7ValueObject } from '../uuidv7-value-object'

export class SaleId extends UuidV7ValueObject {
  protected static override fieldName = 'Sale ID'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): SaleId {
    this.ensureIsValidUuidV7(value)
    return new SaleId(value)
  }
}
