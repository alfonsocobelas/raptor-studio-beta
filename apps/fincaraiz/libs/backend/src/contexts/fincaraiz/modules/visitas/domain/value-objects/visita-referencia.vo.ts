import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { VISITA_CONSTRAINTS } from '../visita-constants'
import { VisitaError } from '../visita-errors'

export class VisitaReferencia extends StringValueObject {
  protected static override fieldName = 'Referencia'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): VisitaReferencia {
    this.ensureIsString(value)
    value = this.normalize(value)

    if (value.length < VISITA_CONSTRAINTS.REFERENCIA.MIN) {
      throw new VisitaError(`Referencia must be at least ${VISITA_CONSTRAINTS.REFERENCIA.MIN} characters`)
    }

    if (value.length > VISITA_CONSTRAINTS.REFERENCIA.MAX) {
      throw new VisitaError(`Referencia must be at most ${VISITA_CONSTRAINTS.REFERENCIA.MAX} characters`)
    }

    return new VisitaReferencia(value)
  }
}
