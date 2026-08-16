import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { PARAMETRO_CONSTRAINTS } from '../parametro-constants'
import { ParametroError } from '../parametro-errors'

export class ParametroMetodo extends StringValueObject {
  protected static override fieldName = 'Método'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): ParametroMetodo {
    this.ensureIsDefined(value)
    value = this.normalize(value)

    if (value.length > PARAMETRO_CONSTRAINTS.METODO.MAX) {
      throw new ParametroError(`Método must be at most ${PARAMETRO_CONSTRAINTS.METODO.MAX} characters`)
    }

    return new ParametroMetodo(value)
  }
}
