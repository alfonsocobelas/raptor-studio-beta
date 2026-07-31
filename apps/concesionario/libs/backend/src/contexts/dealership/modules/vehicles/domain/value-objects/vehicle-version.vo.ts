import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { VEHICLE_CONSTRAINTS } from '../vehicle-constants'
import { VehicleError } from '../vehicle-errors'

export class VehicleVersion extends StringValueObject {
  protected static override fieldName = 'Vehicle version'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): VehicleVersion {
    this.ensureIsDefined(value)
    value = this.normalize(value)

    if (value.length > VEHICLE_CONSTRAINTS.VERSION.MAX) {
      throw new VehicleError(`Vehicle version must be at most ${VEHICLE_CONSTRAINTS.VERSION.MAX} characters`)
    }

    return new VehicleVersion(value)
  }
}
