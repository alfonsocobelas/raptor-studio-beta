import { UuidV7ValueObject } from '../uuidv7-value-object'

export class AgenteId extends UuidV7ValueObject {
  protected static override fieldName = 'Agente ID'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): AgenteId {
    this.ensureIsValidUuidV7(value)
    return new AgenteId(value)
  }
}
