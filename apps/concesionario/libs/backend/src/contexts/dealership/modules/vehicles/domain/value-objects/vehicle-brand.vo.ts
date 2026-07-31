import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { VEHICLE_CONSTRAINTS } from '../vehicle-constants'
import { VehicleError } from '../vehicle-errors'

export class VehicleBrand extends StringValueObject {
  protected static override fieldName = 'Vehicle brand'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): VehicleBrand {
    this.ensureIsString(value)
    value = this.normalize(value)

    if (value.length < VEHICLE_CONSTRAINTS.BRAND.MIN) {
      throw new VehicleError(`Vehicle brand must be at least ${VEHICLE_CONSTRAINTS.BRAND.MIN} characters`)
    }

    if (value.length > VEHICLE_CONSTRAINTS.BRAND.MAX) {
      throw new VehicleError(`Vehicle brand must be at most ${VEHICLE_CONSTRAINTS.BRAND.MAX} characters`)
    }

    return new VehicleBrand(value)
  }
}
