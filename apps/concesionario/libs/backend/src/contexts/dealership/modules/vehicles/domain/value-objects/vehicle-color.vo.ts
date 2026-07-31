import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { VEHICLE_CONSTRAINTS } from '../vehicle-constants'
import { VehicleError } from '../vehicle-errors'

export class VehicleColor extends StringValueObject {
  protected static override fieldName = 'Vehicle color'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): VehicleColor {
    this.ensureIsDefined(value)
    value = this.normalize(value)

    if (value.length > VEHICLE_CONSTRAINTS.COLOR.MAX) {
      throw new VehicleError(`Vehicle color must be at most ${VEHICLE_CONSTRAINTS.COLOR.MAX} characters`)
    }

    return new VehicleColor(value)
  }
}
