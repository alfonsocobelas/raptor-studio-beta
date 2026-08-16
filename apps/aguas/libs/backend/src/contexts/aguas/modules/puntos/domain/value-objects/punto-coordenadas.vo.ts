import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { PUNTO_CONSTRAINTS } from '../punto-constants'
import { PuntoError } from '../punto-errors'

export class PuntoCoordenadas extends StringValueObject {
  protected static override fieldName = 'Coordenadas'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): PuntoCoordenadas {
    this.ensureIsDefined(value)
    value = this.normalize(value)

    if (value.length > PUNTO_CONSTRAINTS.COORDENADAS.MAX) {
      throw new PuntoError(`Coordenadas must be at most ${PUNTO_CONSTRAINTS.COORDENADAS.MAX} characters`)
    }

    return new PuntoCoordenadas(value)
  }
}
