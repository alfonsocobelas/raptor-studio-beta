import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { MUESTRA_CONSTRAINTS } from '../muestra-constants'
import { MuestraError } from '../muestra-errors'

export class MuestraCodigo extends StringValueObject {
  protected static override fieldName = 'Código'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): MuestraCodigo {
    this.ensureIsString(value)
    value = this.normalize(value)

    if (value.length < MUESTRA_CONSTRAINTS.CODIGO.MIN) {
      throw new MuestraError(`Código must be at least ${MUESTRA_CONSTRAINTS.CODIGO.MIN} characters`)
    }

    if (value.length > MUESTRA_CONSTRAINTS.CODIGO.MAX) {
      throw new MuestraError(`Código must be at most ${MUESTRA_CONSTRAINTS.CODIGO.MAX} characters`)
    }

    return new MuestraCodigo(value)
  }
}
