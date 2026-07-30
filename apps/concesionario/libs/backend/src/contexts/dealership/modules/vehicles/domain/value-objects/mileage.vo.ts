import { IntegerValueObject } from '../../../../../shared/domain/value-objects/integer-value-object'
import { VEHICLE_CONSTRAINTS } from '../vehicle-constants'
import { VehicleError } from '../vehicle-errors'

export class Mileage extends IntegerValueObject {
  protected static override fieldName = 'Mileage'

  private constructor(value: number) {
    super(value)
  }

  static create(value: number): Mileage {
    this.ensureIsInteger(value)

    if (value < VEHICLE_CONSTRAINTS.MILEAGE.MIN) {
      throw new VehicleError(`Mileage must be at least ${VEHICLE_CONSTRAINTS.MILEAGE.MIN}`)
    }

    return new Mileage(value)
  }
}
