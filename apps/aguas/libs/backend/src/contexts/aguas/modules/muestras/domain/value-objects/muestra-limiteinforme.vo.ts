import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { MuestraError } from '../muestra-errors'

export class MuestraLimiteinforme extends StringValueObject {
  protected static override fieldName = 'Límite de informe'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): MuestraLimiteinforme {
    this.ensureIsDefined(value)
    value = this.normalize(value)

    return new MuestraLimiteinforme(value)
  }
}
