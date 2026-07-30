import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { CLIENT_CONSTRAINTS } from '../client-constants'
import { ClientError } from '../client-errors'

export class ClientEmail extends StringValueObject {
  protected static override fieldName = 'Client email'

  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): ClientEmail {
    this.ensureIsDefined(value)
    value = this.normalize(value)

    if (value.length > CLIENT_CONSTRAINTS.EMAIL.MAX) {
      throw new ClientError(`Client email must be at most ${CLIENT_CONSTRAINTS.EMAIL.MAX} characters`)
    }

    if (value !== '' && !ClientEmail.EMAIL_REGEX.test(value)) {
      throw new ClientError('Client email format is invalid')
    }

    return new ClientEmail(value)
  }
}
