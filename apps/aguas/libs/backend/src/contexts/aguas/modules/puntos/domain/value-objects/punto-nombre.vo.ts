import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { PUNTO_CONSTRAINTS } from '../punto-constants'
import { PuntoError } from '../punto-errors'

export class PuntoNombre extends StringValueObject {
  protected static override fieldName = 'Nombre'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): PuntoNombre {
    this.ensureIsString(value)
    value = this.normalize(value)

    if (value.length < PUNTO_CONSTRAINTS.NOMBRE.MIN) {
      throw new PuntoError(`Nombre must be at least ${PUNTO_CONSTRAINTS.NOMBRE.MIN} characters`)
    }

    if (value.length > PUNTO_CONSTRAINTS.NOMBRE.MAX) {
      throw new PuntoError(`Nombre must be at most ${PUNTO_CONSTRAINTS.NOMBRE.MAX} characters`)
    }

    return new PuntoNombre(value)
  }
}
