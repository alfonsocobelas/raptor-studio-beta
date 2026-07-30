import { NumberValueObject } from '../../../../../shared/domain/value-objects/number-value-object'
import { LICENSE_CONSTRAINTS } from '../license-constants'
import { LicenseError } from '../license-errors'

export class PricePerUnit extends NumberValueObject {
  protected static override fieldName = 'Price per unit'

  private constructor(value: number) {
    super(value)
  }

  static create(value: number): PricePerUnit {
    this.ensureIsNumber(value)

    if (value < LICENSE_CONSTRAINTS.PRICE_PER_UNIT.MIN) {
      throw new LicenseError(`Price per unit must be at least ${LICENSE_CONSTRAINTS.PRICE_PER_UNIT.MIN}`)
    }

    return new PricePerUnit(value)
  }
}
