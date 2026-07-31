import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { CLIENT_CONSTRAINTS } from '../client-constants'
import { ClientError } from '../client-errors'

export class ClientName extends StringValueObject {
  protected static override fieldName = 'Client name'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): ClientName {
    this.ensureIsString(value)
    value = this.normalize(value)

    if (value.length < CLIENT_CONSTRAINTS.NAME.MIN) {
      throw new ClientError(`Client name must be at least ${CLIENT_CONSTRAINTS.NAME.MIN} characters`)
    }

    if (value.length > CLIENT_CONSTRAINTS.NAME.MAX) {
      throw new ClientError(`Client name must be at most ${CLIENT_CONSTRAINTS.NAME.MAX} characters`)
    }

    return new ClientName(value)
  }
}
