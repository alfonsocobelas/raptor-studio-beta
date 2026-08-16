import { UuidV7ValueObject } from '../uuidv7-value-object'

export class MuestraId extends UuidV7ValueObject {
  protected static override fieldName = 'Muestra ID'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): MuestraId {
    this.ensureIsValidUuidV7(value)
    return new MuestraId(value)
  }
}
