import { UuidV7ValueObject } from '../uuidv7-value-object'

export class GarmentId extends UuidV7ValueObject {
  protected static override fieldName = 'Garment ID'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): GarmentId {
    this.ensureIsValidUuidV7(value)
    return new GarmentId(value)
  }
}
