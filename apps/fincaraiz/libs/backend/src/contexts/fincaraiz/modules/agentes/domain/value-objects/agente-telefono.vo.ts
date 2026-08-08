import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { AGENTE_CONSTRAINTS } from '../agente-constants'
import { AgenteError } from '../agente-errors'

export class AgenteTelefono extends StringValueObject {
  protected static override fieldName = 'Teléfono'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): AgenteTelefono {
    this.ensureIsDefined(value)
    value = this.normalize(value)

    if (value.length > AGENTE_CONSTRAINTS.TELEFONO.MAX) {
      throw new AgenteError(`Teléfono must be at most ${AGENTE_CONSTRAINTS.TELEFONO.MAX} characters`)
    }

    return new AgenteTelefono(value)
  }
}
