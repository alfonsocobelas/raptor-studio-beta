import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { CUSTOMER_CONSTRAINTS } from '../customer-constants'
import { CustomerError } from '../customer-errors'

export class CustomerCountry extends StringValueObject {
  protected static override fieldName = 'Customer country'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): CustomerCountry {
    this.ensureIsDefined(value)
    value = this.normalize(value)

    if (value.length > CUSTOMER_CONSTRAINTS.COUNTRY.MAX) {
      throw new CustomerError(`Customer country must be at most ${CUSTOMER_CONSTRAINTS.COUNTRY.MAX} characters`)
    }

    return new CustomerCountry(value)
  }
}
