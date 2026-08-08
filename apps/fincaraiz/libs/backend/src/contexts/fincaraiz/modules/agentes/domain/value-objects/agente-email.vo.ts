import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { AGENTE_CONSTRAINTS } from '../agente-constants'
import { AgenteError } from '../agente-errors'

export class AgenteEmail extends StringValueObject {
  protected static override fieldName = 'Email'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): AgenteEmail {
    this.ensureIsDefined(value)
    value = this.normalize(value)

    if (value.length > AGENTE_CONSTRAINTS.EMAIL.MAX) {
      throw new AgenteError(`Email must be at most ${AGENTE_CONSTRAINTS.EMAIL.MAX} characters`)
    }

    return new AgenteEmail(value)
  }
}
