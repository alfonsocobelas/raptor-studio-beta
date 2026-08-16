import { UuidV7ValueObject } from '../uuidv7-value-object'

export class ParametroId extends UuidV7ValueObject {
  protected static override fieldName = 'Parametro ID'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): ParametroId {
    this.ensureIsValidUuidV7(value)
    return new ParametroId(value)
  }
}
