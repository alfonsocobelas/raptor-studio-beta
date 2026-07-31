import { UuidV7ValueObject } from '../uuidv7-value-object'

export class VehicleId extends UuidV7ValueObject {
  protected static override fieldName = 'Vehicle ID'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): VehicleId {
    this.ensureIsValidUuidV7(value)
    return new VehicleId(value)
  }
}
