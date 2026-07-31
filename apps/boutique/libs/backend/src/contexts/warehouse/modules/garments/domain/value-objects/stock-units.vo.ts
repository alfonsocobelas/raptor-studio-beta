import { IntegerValueObject } from '../../../../../shared/domain/value-objects/integer-value-object'
import { GARMENT_CONSTRAINTS } from '../garment-constants'
import { GarmentError } from '../garment-errors'

export class StockUnits extends IntegerValueObject {
  protected static override fieldName = 'Stock units'

  private constructor(value: number) {
    super(value)
  }

  static create(value: number): StockUnits {
    this.ensureIsInteger(value)

    if (value < GARMENT_CONSTRAINTS.STOCK.MIN) {
      throw new GarmentError(`Stock units must be at least ${GARMENT_CONSTRAINTS.STOCK.MIN}`)
    }

    return new StockUnits(value)
  }
}
