import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { CLIENTE_CONSTRAINTS } from '../cliente-constants'
import { ClienteError } from '../cliente-errors'

export class ClienteNombre extends StringValueObject {
  protected static override fieldName = 'Nombre'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): ClienteNombre {
    this.ensureIsString(value)
    value = this.normalize(value)

    if (value.length < CLIENTE_CONSTRAINTS.NOMBRE.MIN) {
      throw new ClienteError(`Nombre must be at least ${CLIENTE_CONSTRAINTS.NOMBRE.MIN} characters`)
    }

    if (value.length > CLIENTE_CONSTRAINTS.NOMBRE.MAX) {
      throw new ClienteError(`Nombre must be at most ${CLIENTE_CONSTRAINTS.NOMBRE.MAX} characters`)
    }

    return new ClienteNombre(value)
  }
}
