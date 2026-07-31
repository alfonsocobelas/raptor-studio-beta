import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { GARMENT_CONSTRAINTS } from '../garment-constants'
import { GarmentError } from '../garment-errors'

export class GarmentBrand extends StringValueObject {
  protected static override fieldName = 'Garment brand'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): GarmentBrand {
    this.ensureIsDefined(value)
    value = this.normalize(value)

    if (value.length > GARMENT_CONSTRAINTS.BRAND.MAX) {
      throw new GarmentError(`Garment brand must be at most ${GARMENT_CONSTRAINTS.BRAND.MAX} characters`)
    }

    return new GarmentBrand(value)
  }
}
