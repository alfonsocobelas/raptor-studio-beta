import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { VEHICLE_CONSTRAINTS } from '../vehicle-constants'
import { VehicleError } from '../vehicle-errors'

export class Vin extends StringValueObject {
  protected static override fieldName = 'VIN'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): Vin {
    this.ensureIsString(value)
    value = this.normalize(value)
    this.ensureHasNoInnerWhitespace(value)

    if (value.length < VEHICLE_CONSTRAINTS.VIN.MIN) {
      throw new VehicleError(`VIN must be at least ${VEHICLE_CONSTRAINTS.VIN.MIN} characters`)
    }

    if (value.length > VEHICLE_CONSTRAINTS.VIN.MAX) {
      throw new VehicleError(`VIN must be at most ${VEHICLE_CONSTRAINTS.VIN.MAX} characters`)
    }

    return new Vin(value)
  }
}
