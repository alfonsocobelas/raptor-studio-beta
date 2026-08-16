import { UuidV7ValueObject } from '../uuidv7-value-object'

export class SessionId extends UuidV7ValueObject {
  protected static override fieldName = 'Session ID'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): SessionId {
    this.ensureIsValidUuidV7(value)
    return new SessionId(value)
  }
}
