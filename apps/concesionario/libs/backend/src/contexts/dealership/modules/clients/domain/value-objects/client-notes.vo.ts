import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { CLIENT_CONSTRAINTS } from '../client-constants'
import { ClientError } from '../client-errors'

export class ClientNotes extends StringValueObject {
  protected static override fieldName = 'Client notes'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): ClientNotes {
    this.ensureIsDefined(value)
    value = this.normalize(value)

    if (value.length > CLIENT_CONSTRAINTS.NOTES.MAX) {
      throw new ClientError(`Client notes must be at most ${CLIENT_CONSTRAINTS.NOTES.MAX} characters`)
    }

    return new ClientNotes(value)
  }
}
