import { NumberValueObject } from '../../../../../shared/domain/value-objects/number-value-object'
import { GARMENT_CONSTRAINTS } from '../garment-constants'
import { GarmentError } from '../garment-errors'

export class GarmentPrice extends NumberValueObject {
  protected static override fieldName = 'Garment price'

  private constructor(value: number) {
    super(value)
  }

  static create(value: number): GarmentPrice {
    this.ensureIsNumber(value)

    if (value < GARMENT_CONSTRAINTS.PRICE.MIN) {
      throw new GarmentError(`Garment price must be at least ${GARMENT_CONSTRAINTS.PRICE.MIN}`)
    }

    return new GarmentPrice(value)
  }
}
