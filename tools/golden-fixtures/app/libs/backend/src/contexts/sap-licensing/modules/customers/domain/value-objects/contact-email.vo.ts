import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { CUSTOMER_CONSTRAINTS } from '../customer-constants'
import { CustomerError } from '../customer-errors'

export class ContactEmail extends StringValueObject {
  protected static override fieldName = 'Contact email'

  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): ContactEmail {
    this.ensureIsDefined(value)
    value = this.normalize(value)

    if (value.length > CUSTOMER_CONSTRAINTS.CONTACT.EMAIL.MAX) {
      throw new CustomerError(`Contact email must be at most ${CUSTOMER_CONSTRAINTS.CONTACT.EMAIL.MAX} characters`)
    }

    if (value !== '' && !ContactEmail.EMAIL_REGEX.test(value)) {
      throw new CustomerError('Contact email format is invalid')
    }

    return new ContactEmail(value)
  }
}
