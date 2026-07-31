import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { CLIENT_CONSTRAINTS } from '../client-constants'
import { ClientError } from '../client-errors'

export class ClientCity extends StringValueObject {
  protected static override fieldName = 'Client city'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): ClientCity {
    this.ensureIsDefined(value)
    value = this.normalize(value)

    if (value.length > CLIENT_CONSTRAINTS.CITY.MAX) {
      throw new ClientError(`Client city must be at most ${CLIENT_CONSTRAINTS.CITY.MAX} characters`)
    }

    return new ClientCity(value)
  }
}
