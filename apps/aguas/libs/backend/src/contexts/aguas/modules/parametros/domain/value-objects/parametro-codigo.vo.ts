import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { PARAMETRO_CONSTRAINTS } from '../parametro-constants'
import { ParametroError } from '../parametro-errors'

export class ParametroCodigo extends StringValueObject {
  protected static override fieldName = 'Código'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): ParametroCodigo {
    this.ensureIsString(value)
    value = this.normalize(value)

    if (value.length < PARAMETRO_CONSTRAINTS.CODIGO.MIN) {
      throw new ParametroError(`Código must be at least ${PARAMETRO_CONSTRAINTS.CODIGO.MIN} characters`)
    }

    if (value.length > PARAMETRO_CONSTRAINTS.CODIGO.MAX) {
      throw new ParametroError(`Código must be at most ${PARAMETRO_CONSTRAINTS.CODIGO.MAX} characters`)
    }

    return new ParametroCodigo(value)
  }
}
