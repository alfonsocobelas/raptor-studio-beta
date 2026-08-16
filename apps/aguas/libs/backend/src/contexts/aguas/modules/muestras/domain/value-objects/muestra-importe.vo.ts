import { NumberValueObject } from '../../../../../shared/domain/value-objects/number-value-object'
import { MUESTRA_CONSTRAINTS } from '../muestra-constants'
import { MuestraError } from '../muestra-errors'

export class MuestraImporte extends NumberValueObject {
  protected static override fieldName = 'Importe'

  private constructor(value: number) {
    super(value)
  }

  static create(value: number): MuestraImporte {
    this.ensureIsNumber(value)

    if (value < MUESTRA_CONSTRAINTS.IMPORTE.MIN) {
      throw new MuestraError(`Importe must be at least ${MUESTRA_CONSTRAINTS.IMPORTE.MIN}`)
    }

    return new MuestraImporte(value)
  }
}
