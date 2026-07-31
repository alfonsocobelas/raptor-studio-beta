import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { CUSTOMER_CONSTRAINTS } from '../customer-constants'
import { CustomerError } from '../customer-errors'

export class ContactName extends StringValueObject {
  protected static override fieldName = 'Contact name'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): ContactName {
    this.ensureIsString(value)
    value = this.normalize(value)

    if (value.length < CUSTOMER_CONSTRAINTS.CONTACT.NAME.MIN) {
      throw new CustomerError(`Contact name must be at least ${CUSTOMER_CONSTRAINTS.CONTACT.NAME.MIN} characters`)
    }

    if (value.length > CUSTOMER_CONSTRAINTS.CONTACT.NAME.MAX) {
      throw new CustomerError(`Contact name must be at most ${CUSTOMER_CONSTRAINTS.CONTACT.NAME.MAX} characters`)
    }

    return new ContactName(value)
  }
}
