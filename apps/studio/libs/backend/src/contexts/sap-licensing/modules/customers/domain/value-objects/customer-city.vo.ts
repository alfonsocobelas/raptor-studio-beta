import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { CUSTOMER_CONSTRAINTS } from '../customer-constants'
import { CustomerError } from '../customer-errors'

export class CustomerCity extends StringValueObject {
  protected static override fieldName = 'Customer city'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): CustomerCity {
    this.ensureIsDefined(value)
    value = this.normalize(value)

    if (value.length > CUSTOMER_CONSTRAINTS.CITY.MAX) {
      throw new CustomerError(`Customer city must be at most ${CUSTOMER_CONSTRAINTS.CITY.MAX} characters`)
    }

    return new CustomerCity(value)
  }
}
