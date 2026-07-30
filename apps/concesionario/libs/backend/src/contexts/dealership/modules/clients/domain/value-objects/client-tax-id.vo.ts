import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { CLIENT_CONSTRAINTS } from '../client-constants'
import { ClientError } from '../client-errors'

export class ClientTaxId extends StringValueObject {
  protected static override fieldName = 'Tax ID'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): ClientTaxId {
    this.ensureIsDefined(value)
    value = this.normalize(value)
    this.ensureHasNoInnerWhitespace(value)

    if (value.length > CLIENT_CONSTRAINTS.TAX_ID.MAX) {
      throw new ClientError(`Tax ID must be at most ${CLIENT_CONSTRAINTS.TAX_ID.MAX} characters`)
    }

    return new ClientTaxId(value)
  }
}
