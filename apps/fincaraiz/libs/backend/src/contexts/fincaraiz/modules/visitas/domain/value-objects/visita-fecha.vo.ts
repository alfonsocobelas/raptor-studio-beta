import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { VisitaError } from '../visita-errors'

export class VisitaFecha extends StringValueObject {
  protected static override fieldName = 'Fecha'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): VisitaFecha {
    this.ensureIsDefined(value)
    value = this.normalize(value)

    return new VisitaFecha(value)
  }
}
