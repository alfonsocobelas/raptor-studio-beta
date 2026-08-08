import { NumberValueObject } from '../../../../../shared/domain/value-objects/number-value-object'
import { PROPIEDAD_CONSTRAINTS } from '../propiedad-constants'
import { PropiedadError } from '../propiedad-errors'

export class PropiedadPrecio extends NumberValueObject {
  protected static override fieldName = 'Precio'

  private constructor(value: number) {
    super(value)
  }

  static create(value: number): PropiedadPrecio {
    this.ensureIsNumber(value)

    if (value < PROPIEDAD_CONSTRAINTS.PRECIO.MIN) {
      throw new PropiedadError(`Precio must be at least ${PROPIEDAD_CONSTRAINTS.PRECIO.MIN}`)
    }

    return new PropiedadPrecio(value)
  }
}
