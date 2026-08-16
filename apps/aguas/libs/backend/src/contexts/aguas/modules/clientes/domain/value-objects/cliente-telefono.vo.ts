import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { CLIENTE_CONSTRAINTS } from '../cliente-constants'
import { ClienteError } from '../cliente-errors'

export class ClienteTelefono extends StringValueObject {
  protected static override fieldName = 'Teléfono'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): ClienteTelefono {
    this.ensureIsDefined(value)
    value = this.normalize(value)

    if (value.length > CLIENTE_CONSTRAINTS.TELEFONO.MAX) {
      throw new ClienteError(`Teléfono must be at most ${CLIENTE_CONSTRAINTS.TELEFONO.MAX} characters`)
    }

    return new ClienteTelefono(value)
  }
}
