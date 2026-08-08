import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { VISITA_CONSTRAINTS } from '../visita-constants'
import { VisitaError } from '../visita-errors'

export class VisitaObservaciones extends StringValueObject {
  protected static override fieldName = 'Observaciones'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): VisitaObservaciones {
    this.ensureIsDefined(value)
    value = this.normalize(value)

    if (value.length > VISITA_CONSTRAINTS.OBSERVACIONES.MAX) {
      throw new VisitaError(`Observaciones must be at most ${VISITA_CONSTRAINTS.OBSERVACIONES.MAX} characters`)
    }

    return new VisitaObservaciones(value)
  }
}
