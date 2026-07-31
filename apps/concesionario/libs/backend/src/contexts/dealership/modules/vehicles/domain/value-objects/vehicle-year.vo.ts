import { IntegerValueObject } from '../../../../../shared/domain/value-objects/integer-value-object'
import { VEHICLE_CONSTRAINTS } from '../vehicle-constants'
import { VehicleError } from '../vehicle-errors'

export class VehicleYear extends IntegerValueObject {
  protected static override fieldName = 'Vehicle year'

  private constructor(value: number) {
    super(value)
  }

  static create(value: number): VehicleYear {
    this.ensureIsInteger(value)

    if (value < VEHICLE_CONSTRAINTS.YEAR.MIN) {
      throw new VehicleError(`Vehicle year must be at least ${VEHICLE_CONSTRAINTS.YEAR.MIN}`)
    }

    return new VehicleYear(value)
  }
}
