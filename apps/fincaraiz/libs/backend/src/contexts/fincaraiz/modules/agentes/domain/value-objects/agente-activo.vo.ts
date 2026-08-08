import { BooleanValueObject } from '../../../../../shared/domain/value-objects/boolean-value-object'

export class AgenteActivo extends BooleanValueObject {
  protected static override fieldName = 'Activo'

  private constructor(value: boolean) {
    super(value)
  }

  static create(value: boolean): AgenteActivo {
    this.ensureIsBoolean(value)
    return new AgenteActivo(value)
  }
}
