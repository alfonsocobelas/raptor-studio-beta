import { NumberValueObject } from '../../../../../shared/domain/value-objects/number-value-object'
import { SALE_CONSTRAINTS } from '../sale-constants'
import { SaleError } from '../sale-errors'

export class SaleDiscount extends NumberValueObject {
  protected static override fieldName = 'Sale discount'

  private constructor(value: number) {
    super(value)
  }

  static create(value: number): SaleDiscount {
    this.ensureIsNumber(value)

    if (value < SALE_CONSTRAINTS.DISCOUNT.MIN) {
      throw new SaleError(`Sale discount must be at least ${SALE_CONSTRAINTS.DISCOUNT.MIN}`)
    }

    return new SaleDiscount(value)
  }
}
