import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { CUSTOMER_CONSTRAINTS } from '../customer-constants'
import { CustomerError } from '../customer-errors'

export class TaxId extends StringValueObject {
  protected static override fieldName = 'Tax ID'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): TaxId {
    this.ensureIsDefined(value)
    value = this.normalize(value)
    this.ensureHasNoInnerWhitespace(value)

    if (value.length > CUSTOMER_CONSTRAINTS.TAX_ID.MAX) {
      throw new CustomerError(`Tax ID must be at most ${CUSTOMER_CONSTRAINTS.TAX_ID.MAX} characters`)
    }

    return new TaxId(value)
  }
}
