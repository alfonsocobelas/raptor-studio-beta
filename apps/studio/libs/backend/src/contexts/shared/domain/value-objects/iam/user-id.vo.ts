import { UuidV7ValueObject } from '../uuidv7-value-object'

export class UserId extends UuidV7ValueObject {
  protected static override fieldName = 'User ID'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): UserId {
    this.ensureIsValidUuidV7(value)
    return new UserId(value)
  }
}
