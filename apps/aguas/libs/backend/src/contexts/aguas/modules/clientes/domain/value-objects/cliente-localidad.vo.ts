import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { CLIENTE_CONSTRAINTS } from '../cliente-constants'
import { ClienteError } from '../cliente-errors'

export class ClienteLocalidad extends StringValueObject {
  protected static override fieldName = 'Localidad'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): ClienteLocalidad {
    this.ensureIsDefined(value)
    value = this.normalize(value)

    if (value.length > CLIENTE_CONSTRAINTS.LOCALIDAD.MAX) {
      throw new ClienteError(`Localidad must be at most ${CLIENTE_CONSTRAINTS.LOCALIDAD.MAX} characters`)
    }

    return new ClienteLocalidad(value)
  }
}
