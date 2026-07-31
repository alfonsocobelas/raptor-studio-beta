import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { VEHICLE_CONSTRAINTS } from '../vehicle-constants'
import { VehicleError } from '../vehicle-errors'

export class VehicleModel extends StringValueObject {
  protected static override fieldName = 'Vehicle model'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): VehicleModel {
    this.ensureIsString(value)
    value = this.normalize(value)

    if (value.length < VEHICLE_CONSTRAINTS.MODEL.MIN) {
      throw new VehicleError(`Vehicle model must be at least ${VEHICLE_CONSTRAINTS.MODEL.MIN} characters`)
    }

    if (value.length > VEHICLE_CONSTRAINTS.MODEL.MAX) {
      throw new VehicleError(`Vehicle model must be at most ${VEHICLE_CONSTRAINTS.MODEL.MAX} characters`)
    }

    return new VehicleModel(value)
  }
}
