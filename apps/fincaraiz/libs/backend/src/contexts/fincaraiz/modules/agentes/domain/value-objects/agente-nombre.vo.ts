import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { AGENTE_CONSTRAINTS } from '../agente-constants'
import { AgenteError } from '../agente-errors'

export class AgenteNombre extends StringValueObject {
  protected static override fieldName = 'Nombre'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): AgenteNombre {
    this.ensureIsString(value)
    value = this.normalize(value)

    if (value.length < AGENTE_CONSTRAINTS.NOMBRE.MIN) {
      throw new AgenteError(`Nombre must be at least ${AGENTE_CONSTRAINTS.NOMBRE.MIN} characters`)
    }

    if (value.length > AGENTE_CONSTRAINTS.NOMBRE.MAX) {
      throw new AgenteError(`Nombre must be at most ${AGENTE_CONSTRAINTS.NOMBRE.MAX} characters`)
    }

    return new AgenteNombre(value)
  }
}
