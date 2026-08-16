import { NumberValueObject } from '../../../../../shared/domain/value-objects/number-value-object'
import { PARAMETRO_CONSTRAINTS } from '../parametro-constants'
import { ParametroError } from '../parametro-errors'

export class ParametroPrecio extends NumberValueObject {
  protected static override fieldName = 'Precio'

  private constructor(value: number) {
    super(value)
  }

  static create(value: number): ParametroPrecio {
    this.ensureIsNumber(value)

    if (value < PARAMETRO_CONSTRAINTS.PRECIO.MIN) {
      throw new ParametroError(`Precio must be at least ${PARAMETRO_CONSTRAINTS.PRECIO.MIN}`)
    }

    return new ParametroPrecio(value)
  }
}
