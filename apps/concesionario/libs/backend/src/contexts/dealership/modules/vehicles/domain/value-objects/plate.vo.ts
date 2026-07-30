import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { VEHICLE_CONSTRAINTS } from '../vehicle-constants'
import { VehicleError } from '../vehicle-errors'

export class Plate extends StringValueObject {
  protected static override fieldName = 'Plate'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): Plate {
    this.ensureIsDefined(value)
    value = this.normalize(value)

    if (value.length > VEHICLE_CONSTRAINTS.PLATE.MAX) {
      throw new VehicleError(`Plate must be at most ${VEHICLE_CONSTRAINTS.PLATE.MAX} characters`)
    }

    return new Plate(value)
  }
}
