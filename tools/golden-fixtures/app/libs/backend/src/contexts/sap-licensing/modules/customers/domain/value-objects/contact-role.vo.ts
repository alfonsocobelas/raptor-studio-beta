import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { CUSTOMER_CONSTRAINTS } from '../customer-constants'
import { CustomerError } from '../customer-errors'

export class ContactRole extends StringValueObject {
  protected static override fieldName = 'Contact role'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): ContactRole {
    this.ensureIsDefined(value)
    value = this.normalize(value)

    if (value.length > CUSTOMER_CONSTRAINTS.CONTACT.ROLE.MAX) {
      throw new CustomerError(`Contact role must be at most ${CUSTOMER_CONSTRAINTS.CONTACT.ROLE.MAX} characters`)
    }

    return new ContactRole(value)
  }
}
