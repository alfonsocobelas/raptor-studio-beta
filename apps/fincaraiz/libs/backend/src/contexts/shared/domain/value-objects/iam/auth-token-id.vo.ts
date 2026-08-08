import { UuidV7ValueObject } from '../uuidv7-value-object'

export class AuthTokenId extends UuidV7ValueObject {
  protected static override fieldName = 'Auth token ID'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): AuthTokenId {
    this.ensureIsValidUuidV7(value)
    return new AuthTokenId(value)
  }
}
