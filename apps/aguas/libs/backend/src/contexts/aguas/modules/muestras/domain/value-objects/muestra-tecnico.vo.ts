import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { MUESTRA_CONSTRAINTS } from '../muestra-constants'
import { MuestraError } from '../muestra-errors'

export class MuestraTecnico extends StringValueObject {
  protected static override fieldName = 'Técnico'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): MuestraTecnico {
    this.ensureIsDefined(value)
    value = this.normalize(value)

    if (value.length > MUESTRA_CONSTRAINTS.TECNICO.MAX) {
      throw new MuestraError(`Técnico must be at most ${MUESTRA_CONSTRAINTS.TECNICO.MAX} characters`)
    }

    return new MuestraTecnico(value)
  }
}
