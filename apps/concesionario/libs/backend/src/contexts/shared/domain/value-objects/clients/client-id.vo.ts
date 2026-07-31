import { UuidV7ValueObject } from '../uuidv7-value-object'

export class ClientId extends UuidV7ValueObject {
  protected static override fieldName = 'Client ID'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): ClientId {
    this.ensureIsValidUuidV7(value)
    return new ClientId(value)
  }
}
