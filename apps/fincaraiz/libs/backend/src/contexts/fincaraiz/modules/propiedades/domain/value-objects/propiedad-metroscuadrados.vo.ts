import { IntegerValueObject } from '../../../../../shared/domain/value-objects/integer-value-object'
import { PROPIEDAD_CONSTRAINTS } from '../propiedad-constants'
import { PropiedadError } from '../propiedad-errors'

export class PropiedadMetroscuadrados extends IntegerValueObject {
  protected static override fieldName = 'Metros cuadrados'

  private constructor(value: number) {
    super(value)
  }

  static create(value: number): PropiedadMetroscuadrados {
    this.ensureIsInteger(value)

    if (value < PROPIEDAD_CONSTRAINTS.METROSCUADRADOS.MIN) {
      throw new PropiedadError(`Metros cuadrados must be at least ${PROPIEDAD_CONSTRAINTS.METROSCUADRADOS.MIN}`)
    }

    return new PropiedadMetroscuadrados(value)
  }
}
