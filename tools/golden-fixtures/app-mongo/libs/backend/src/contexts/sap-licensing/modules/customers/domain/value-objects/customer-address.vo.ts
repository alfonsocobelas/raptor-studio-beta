import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { CUSTOMER_CONSTRAINTS } from '../customer-constants'
import { CustomerError } from '../customer-errors'

export class CustomerAddress extends StringValueObject {
  protected static override fieldName = 'Customer address'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): CustomerAddress {
    this.ensureIsDefined(value)
    value = this.normalize(value)

    if (value.length > CUSTOMER_CONSTRAINTS.ADDRESS.MAX) {
      throw new CustomerError(`Customer address must be at most ${CUSTOMER_CONSTRAINTS.ADDRESS.MAX} characters`)
    }

    return new CustomerAddress(value)
  }
}
