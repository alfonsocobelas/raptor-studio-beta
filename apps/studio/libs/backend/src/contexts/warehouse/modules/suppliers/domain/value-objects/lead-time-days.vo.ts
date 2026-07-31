import { IntegerValueObject } from '../../../../../shared/domain/value-objects/integer-value-object'
import { SUPPLIER_CONSTRAINTS } from '../supplier-constants'
import { SupplierError } from '../supplier-errors'

export class LeadTimeDays extends IntegerValueObject {
  protected static override fieldName = 'Lead time days'

  private constructor(value: number) {
    super(value)
  }

  static create(value: number): LeadTimeDays {
    this.ensureIsInteger(value)

    if (value < SUPPLIER_CONSTRAINTS.LEAD_TIME.MIN) {
      throw new SupplierError(`Lead time days must be at least ${SUPPLIER_CONSTRAINTS.LEAD_TIME.MIN}`)
    }

    return new LeadTimeDays(value)
  }
}
