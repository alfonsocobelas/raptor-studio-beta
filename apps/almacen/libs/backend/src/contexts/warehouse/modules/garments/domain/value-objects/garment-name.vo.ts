import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { GARMENT_CONSTRAINTS } from '../garment-constants'
import { GarmentError } from '../garment-errors'

export class GarmentName extends StringValueObject {
  protected static override fieldName = 'Garment name'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): GarmentName {
    this.ensureIsString(value)
    value = this.normalize(value)

    if (value.length < GARMENT_CONSTRAINTS.NAME.MIN) {
      throw new GarmentError(`Garment name must be at least ${GARMENT_CONSTRAINTS.NAME.MIN} characters`)
    }

    if (value.length > GARMENT_CONSTRAINTS.NAME.MAX) {
      throw new GarmentError(`Garment name must be at most ${GARMENT_CONSTRAINTS.NAME.MAX} characters`)
    }

    return new GarmentName(value)
  }
}
