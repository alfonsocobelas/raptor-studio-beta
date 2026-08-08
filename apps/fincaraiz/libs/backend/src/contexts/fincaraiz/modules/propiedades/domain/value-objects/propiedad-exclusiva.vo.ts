import { BooleanValueObject } from '../../../../../shared/domain/value-objects/boolean-value-object'

export class PropiedadExclusiva extends BooleanValueObject {
  protected static override fieldName = 'En exclusiva'

  private constructor(value: boolean) {
    super(value)
  }

  static create(value: boolean): PropiedadExclusiva {
    this.ensureIsBoolean(value)
    return new PropiedadExclusiva(value)
  }
}
