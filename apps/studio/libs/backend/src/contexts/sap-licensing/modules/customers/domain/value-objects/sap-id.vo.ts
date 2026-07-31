import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { CUSTOMER_CONSTRAINTS } from '../customer-constants'
import { CustomerError } from '../customer-errors'

export class SapId extends StringValueObject {
  protected static override fieldName = 'SAP ID'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): SapId {
    this.ensureIsString(value)
    value = this.normalize(value)
    this.ensureHasNoInnerWhitespace(value)

    if (value.length < CUSTOMER_CONSTRAINTS.SAP_ID.MIN) {
      throw new CustomerError(`SAP ID must be at least ${CUSTOMER_CONSTRAINTS.SAP_ID.MIN} characters`)
    }

    if (value.length > CUSTOMER_CONSTRAINTS.SAP_ID.MAX) {
      throw new CustomerError(`SAP ID must be at most ${CUSTOMER_CONSTRAINTS.SAP_ID.MAX} characters`)
    }

    return new SapId(value)
  }
}
