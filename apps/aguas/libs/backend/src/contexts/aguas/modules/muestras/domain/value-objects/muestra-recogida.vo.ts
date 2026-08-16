import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { MuestraError } from '../muestra-errors'

export class MuestraRecogida extends StringValueObject {
  protected static override fieldName = 'Recogida'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): MuestraRecogida {
    this.ensureIsDefined(value)
    value = this.normalize(value)

    return new MuestraRecogida(value)
  }
}
