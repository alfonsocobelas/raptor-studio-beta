import { NumberValueObject } from '../../../../../shared/domain/value-objects/number-value-object'
import { SALE_CONSTRAINTS } from '../sale-constants'
import { SaleError } from '../sale-errors'

export class SaleAmount extends NumberValueObject {
  protected static override fieldName = 'Sale amount'

  private constructor(value: number) {
    super(value)
  }

  static create(value: number): SaleAmount {
    this.ensureIsNumber(value)

    if (value < SALE_CONSTRAINTS.AMOUNT.MIN) {
      throw new SaleError(`Sale amount must be at least ${SALE_CONSTRAINTS.AMOUNT.MIN}`)
    }

    return new SaleAmount(value)
  }
}
