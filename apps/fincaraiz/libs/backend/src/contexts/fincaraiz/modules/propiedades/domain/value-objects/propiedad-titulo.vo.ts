import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { PROPIEDAD_CONSTRAINTS } from '../propiedad-constants'
import { PropiedadError } from '../propiedad-errors'

export class PropiedadTitulo extends StringValueObject {
  protected static override fieldName = 'Título'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): PropiedadTitulo {
    this.ensureIsString(value)
    value = this.normalize(value)

    if (value.length < PROPIEDAD_CONSTRAINTS.TITULO.MIN) {
      throw new PropiedadError(`Título must be at least ${PROPIEDAD_CONSTRAINTS.TITULO.MIN} characters`)
    }

    if (value.length > PROPIEDAD_CONSTRAINTS.TITULO.MAX) {
      throw new PropiedadError(`Título must be at most ${PROPIEDAD_CONSTRAINTS.TITULO.MAX} characters`)
    }

    return new PropiedadTitulo(value)
  }
}
