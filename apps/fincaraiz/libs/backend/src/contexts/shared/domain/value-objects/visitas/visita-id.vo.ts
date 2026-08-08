import { UuidV7ValueObject } from '../uuidv7-value-object'

export class VisitaId extends UuidV7ValueObject {
  protected static override fieldName = 'Visita ID'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): VisitaId {
    this.ensureIsValidUuidV7(value)
    return new VisitaId(value)
  }
}
