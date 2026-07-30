import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { CUSTOMER_CONSTRAINTS } from '../customer-constants'
import { CustomerError } from '../customer-errors'

export class CustomerNotes extends StringValueObject {
  protected static override fieldName = 'Customer notes'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): CustomerNotes {
    this.ensureIsDefined(value)
    value = this.normalize(value)

    if (value.length > CUSTOMER_CONSTRAINTS.NOTES.MAX) {
      throw new CustomerError(`Customer notes must be at most ${CUSTOMER_CONSTRAINTS.NOTES.MAX} characters`)
    }

    return new CustomerNotes(value)
  }
}
