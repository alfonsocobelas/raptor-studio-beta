import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { GARMENT_CONSTRAINTS } from '../garment-constants'
import { GarmentError } from '../garment-errors'

export class GarmentColor extends StringValueObject {
  protected static override fieldName = 'Garment color'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): GarmentColor {
    this.ensureIsDefined(value)
    value = this.normalize(value)

    if (value.length > GARMENT_CONSTRAINTS.COLOR.MAX) {
      throw new GarmentError(`Garment color must be at most ${GARMENT_CONSTRAINTS.COLOR.MAX} characters`)
    }

    return new GarmentColor(value)
  }
}
