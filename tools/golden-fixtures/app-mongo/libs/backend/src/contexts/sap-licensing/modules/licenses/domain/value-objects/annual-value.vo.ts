import { NumberValueObject } from '../../../../../shared/domain/value-objects/number-value-object'
import { LICENSE_CONSTRAINTS } from '../license-constants'
import { LicenseError } from '../license-errors'

export class AnnualValue extends NumberValueObject {
  protected static override fieldName = 'Annual value'

  private constructor(value: number) {
    super(value)
  }

  static create(value: number): AnnualValue {
    this.ensureIsNumber(value)

    if (value < LICENSE_CONSTRAINTS.ANNUAL_VALUE.MIN) {
      throw new LicenseError(`Annual value must be at least ${LICENSE_CONSTRAINTS.ANNUAL_VALUE.MIN}`)
    }

    return new AnnualValue(value)
  }
}
