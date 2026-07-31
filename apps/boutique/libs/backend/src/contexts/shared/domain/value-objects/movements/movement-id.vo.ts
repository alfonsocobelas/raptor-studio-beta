import { UuidV7ValueObject } from '../uuidv7-value-object'

export class MovementId extends UuidV7ValueObject {
  protected static override fieldName = 'Movement ID'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): MovementId {
    this.ensureIsValidUuidV7(value)
    return new MovementId(value)
  }
}
