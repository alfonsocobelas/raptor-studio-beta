import { UuidV7ValueObject } from '../uuidv7-value-object'

export class PuntoId extends UuidV7ValueObject {
  protected static override fieldName = 'Punto ID'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): PuntoId {
    this.ensureIsValidUuidV7(value)
    return new PuntoId(value)
  }
}
