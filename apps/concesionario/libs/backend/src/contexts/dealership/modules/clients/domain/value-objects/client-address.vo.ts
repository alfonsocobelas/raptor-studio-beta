import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { CLIENT_CONSTRAINTS } from '../client-constants'
import { ClientError } from '../client-errors'

export class ClientAddress extends StringValueObject {
  protected static override fieldName = 'Client address'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): ClientAddress {
    this.ensureIsDefined(value)
    value = this.normalize(value)

    if (value.length > CLIENT_CONSTRAINTS.ADDRESS.MAX) {
      throw new ClientError(`Client address must be at most ${CLIENT_CONSTRAINTS.ADDRESS.MAX} characters`)
    }

    return new ClientAddress(value)
  }
}
