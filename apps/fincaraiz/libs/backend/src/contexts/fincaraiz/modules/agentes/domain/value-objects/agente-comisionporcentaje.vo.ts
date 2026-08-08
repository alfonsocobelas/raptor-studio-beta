import { NumberValueObject } from '../../../../../shared/domain/value-objects/number-value-object'
import { AGENTE_CONSTRAINTS } from '../agente-constants'
import { AgenteError } from '../agente-errors'

export class AgenteComisionporcentaje extends NumberValueObject {
  protected static override fieldName = 'Comisión (%)'

  private constructor(value: number) {
    super(value)
  }

  static create(value: number): AgenteComisionporcentaje {
    this.ensureIsNumber(value)

    if (value < AGENTE_CONSTRAINTS.COMISIONPORCENTAJE.MIN) {
      throw new AgenteError(`Comisión (%) must be at least ${AGENTE_CONSTRAINTS.COMISIONPORCENTAJE.MIN}`)
    }

    return new AgenteComisionporcentaje(value)
  }
}
