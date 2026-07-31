import { NumberValueObject } from '../../../../../shared/domain/value-objects/number-value-object'
import { VEHICLE_CONSTRAINTS } from '../vehicle-constants'
import { VehicleError } from '../vehicle-errors'

export class Price extends NumberValueObject {
  protected static override fieldName = 'Price'

  private constructor(value: number) {
    super(value)
  }

  static create(value: number): Price {
    this.ensureIsNumber(value)

    if (value < VEHICLE_CONSTRAINTS.PRICE.MIN) {
      throw new VehicleError(`Price must be at least ${VEHICLE_CONSTRAINTS.PRICE.MIN}`)
    }

    return new Price(value)
  }
}
