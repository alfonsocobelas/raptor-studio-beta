import { UuidV7ValueObject } from '../uuidv7-value-object'

export class PropiedadId extends UuidV7ValueObject {
  protected static override fieldName = 'Propiedad ID'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): PropiedadId {
    this.ensureIsValidUuidV7(value)
    return new PropiedadId(value)
  }
}
