import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { SALE_CONSTRAINTS } from '../sale-constants'
import { SaleError } from '../sale-errors'

export class SaleVehicleLabel extends StringValueObject {
  protected static override fieldName = 'Sale vehicle'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): SaleVehicleLabel {
    this.ensureIsString(value)
    value = this.normalize(value)

    if (value.length < SALE_CONSTRAINTS.VEHICLE_LABEL.MIN) {
      throw new SaleError(`Sale vehicle must be at least ${SALE_CONSTRAINTS.VEHICLE_LABEL.MIN} characters`)
    }

    if (value.length > SALE_CONSTRAINTS.VEHICLE_LABEL.MAX) {
      throw new SaleError(`Sale vehicle must be at most ${SALE_CONSTRAINTS.VEHICLE_LABEL.MAX} characters`)
    }

    return new SaleVehicleLabel(value)
  }
}
