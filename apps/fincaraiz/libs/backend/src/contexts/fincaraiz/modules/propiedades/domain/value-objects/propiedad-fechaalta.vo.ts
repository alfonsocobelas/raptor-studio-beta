import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { PropiedadError } from '../propiedad-errors'

export class PropiedadFechaalta extends StringValueObject {
  protected static override fieldName = 'Fecha de alta'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): PropiedadFechaalta {
    this.ensureIsDefined(value)
    value = this.normalize(value)

    return new PropiedadFechaalta(value)
  }
}
