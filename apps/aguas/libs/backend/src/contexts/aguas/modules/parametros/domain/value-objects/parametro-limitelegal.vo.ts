import { NumberValueObject } from '../../../../../shared/domain/value-objects/number-value-object'
import { PARAMETRO_CONSTRAINTS } from '../parametro-constants'
import { ParametroError } from '../parametro-errors'

export class ParametroLimitelegal extends NumberValueObject {
  protected static override fieldName = 'Límite legal'

  private constructor(value: number) {
    super(value)
  }

  static create(value: number): ParametroLimitelegal {
    this.ensureIsNumber(value)

    if (value < PARAMETRO_CONSTRAINTS.LIMITELEGAL.MIN) {
      throw new ParametroError(`Límite legal must be at least ${PARAMETRO_CONSTRAINTS.LIMITELEGAL.MIN}`)
    }

    return new ParametroLimitelegal(value)
  }
}
