import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { VEHICLE_CONSTRAINTS } from '../vehicle-constants'
import { VehicleError } from '../vehicle-errors'

export class VehicleNotes extends StringValueObject {
  protected static override fieldName = 'Vehicle notes'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): VehicleNotes {
    this.ensureIsDefined(value)
    value = this.normalize(value)

    if (value.length > VEHICLE_CONSTRAINTS.NOTES.MAX) {
      throw new VehicleError(`Vehicle notes must be at most ${VEHICLE_CONSTRAINTS.NOTES.MAX} characters`)
    }

    return new VehicleNotes(value)
  }
}
