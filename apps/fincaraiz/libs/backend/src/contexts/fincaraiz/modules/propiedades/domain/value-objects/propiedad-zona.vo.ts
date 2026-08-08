import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { PROPIEDAD_CONSTRAINTS } from '../propiedad-constants'
import { PropiedadError } from '../propiedad-errors'

export class PropiedadZona extends StringValueObject {
  protected static override fieldName = 'Zona'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): PropiedadZona {
    this.ensureIsDefined(value)
    value = this.normalize(value)

    if (value.length > PROPIEDAD_CONSTRAINTS.ZONA.MAX) {
      throw new PropiedadError(`Zona must be at most ${PROPIEDAD_CONSTRAINTS.ZONA.MAX} characters`)
    }

    return new PropiedadZona(value)
  }
}
