import { BooleanValueObject } from '../../../../../shared/domain/value-objects/boolean-value-object'

export class VisitaConfirmada extends BooleanValueObject {
  protected static override fieldName = 'Confirmada'

  private constructor(value: boolean) {
    super(value)
  }

  static create(value: boolean): VisitaConfirmada {
    this.ensureIsBoolean(value)
    return new VisitaConfirmada(value)
  }
}
