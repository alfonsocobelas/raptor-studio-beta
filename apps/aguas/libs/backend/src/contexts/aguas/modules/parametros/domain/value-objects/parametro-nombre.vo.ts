import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { PARAMETRO_CONSTRAINTS } from '../parametro-constants'
import { ParametroError } from '../parametro-errors'

export class ParametroNombre extends StringValueObject {
  protected static override fieldName = 'Nombre'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): ParametroNombre {
    this.ensureIsDefined(value)
    value = this.normalize(value)

    if (value.length > PARAMETRO_CONSTRAINTS.NOMBRE.MAX) {
      throw new ParametroError(`Nombre must be at most ${PARAMETRO_CONSTRAINTS.NOMBRE.MAX} characters`)
    }

    return new ParametroNombre(value)
  }
}
