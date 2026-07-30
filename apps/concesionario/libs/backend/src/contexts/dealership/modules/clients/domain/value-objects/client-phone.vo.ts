import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { CLIENT_CONSTRAINTS } from '../client-constants'
import { ClientError } from '../client-errors'

export class ClientPhone extends StringValueObject {
  protected static override fieldName = 'Client phone'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): ClientPhone {
    this.ensureIsDefined(value)
    value = this.normalize(value)

    if (value.length > CLIENT_CONSTRAINTS.PHONE.MAX) {
      throw new ClientError(`Client phone must be at most ${CLIENT_CONSTRAINTS.PHONE.MAX} characters`)
    }

    return new ClientPhone(value)
  }
}
