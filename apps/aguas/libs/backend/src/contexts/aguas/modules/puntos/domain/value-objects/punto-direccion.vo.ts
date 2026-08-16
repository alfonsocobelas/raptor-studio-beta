import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { PUNTO_CONSTRAINTS } from '../punto-constants'
import { PuntoError } from '../punto-errors'

export class PuntoDireccion extends StringValueObject {
  protected static override fieldName = 'Dirección'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): PuntoDireccion {
    this.ensureIsDefined(value)
    value = this.normalize(value)

    if (value.length > PUNTO_CONSTRAINTS.DIRECCION.MAX) {
      throw new PuntoError(`Dirección must be at most ${PUNTO_CONSTRAINTS.DIRECCION.MAX} characters`)
    }

    return new PuntoDireccion(value)
  }
}
