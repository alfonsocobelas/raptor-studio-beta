import { UuidV7ValueObject } from '../uuidv7-value-object'

export class ClienteId extends UuidV7ValueObject {
  protected static override fieldName = 'Cliente ID'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): ClienteId {
    this.ensureIsValidUuidV7(value)
    return new ClienteId(value)
  }
}
