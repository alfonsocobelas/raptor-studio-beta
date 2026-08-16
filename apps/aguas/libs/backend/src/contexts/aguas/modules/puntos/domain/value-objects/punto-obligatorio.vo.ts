import { BooleanValueObject } from '../../../../../shared/domain/value-objects/boolean-value-object'

export class PuntoObligatorio extends BooleanValueObject {
  protected static override fieldName = 'Control obligatorio'

  private constructor(value: boolean) {
    super(value)
  }

  static create(value: boolean): PuntoObligatorio {
    this.ensureIsBoolean(value)
    return new PuntoObligatorio(value)
  }
}
