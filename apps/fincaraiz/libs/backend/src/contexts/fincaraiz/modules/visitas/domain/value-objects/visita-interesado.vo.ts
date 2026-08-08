import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { VISITA_CONSTRAINTS } from '../visita-constants'
import { VisitaError } from '../visita-errors'

export class VisitaInteresado extends StringValueObject {
  protected static override fieldName = 'Interesado'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): VisitaInteresado {
    this.ensureIsDefined(value)
    value = this.normalize(value)

    if (value.length > VISITA_CONSTRAINTS.INTERESADO.MAX) {
      throw new VisitaError(`Interesado must be at most ${VISITA_CONSTRAINTS.INTERESADO.MAX} characters`)
    }

    return new VisitaInteresado(value)
  }
}
