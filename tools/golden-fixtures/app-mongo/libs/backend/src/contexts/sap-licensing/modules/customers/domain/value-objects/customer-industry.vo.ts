import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { CUSTOMER_CONSTRAINTS } from '../customer-constants'
import { CustomerError } from '../customer-errors'

export class CustomerIndustry extends StringValueObject {
  protected static override fieldName = 'Customer industry'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): CustomerIndustry {
    this.ensureIsDefined(value)
    value = this.normalize(value)

    if (value.length > CUSTOMER_CONSTRAINTS.INDUSTRY.MAX) {
      throw new CustomerError(`Customer industry must be at most ${CUSTOMER_CONSTRAINTS.INDUSTRY.MAX} characters`)
    }

    return new CustomerIndustry(value)
  }
}
