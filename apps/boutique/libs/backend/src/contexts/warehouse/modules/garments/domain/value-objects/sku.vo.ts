import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { GARMENT_CONSTRAINTS } from '../garment-constants'
import { GarmentError } from '../garment-errors'

export class Sku extends StringValueObject {
  protected static override fieldName = 'SKU'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): Sku {
    this.ensureIsString(value)
    value = this.normalize(value)
    this.ensureHasNoInnerWhitespace(value)

    if (value.length < GARMENT_CONSTRAINTS.SKU.MIN) {
      throw new GarmentError(`SKU must be at least ${GARMENT_CONSTRAINTS.SKU.MIN} characters`)
    }

    if (value.length > GARMENT_CONSTRAINTS.SKU.MAX) {
      throw new GarmentError(`SKU must be at most ${GARMENT_CONSTRAINTS.SKU.MAX} characters`)
    }

    return new Sku(value)
  }
}
