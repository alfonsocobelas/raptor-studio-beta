import { IntegerValueObject } from '../../../../../shared/domain/value-objects/integer-value-object'
import { LICENSE_CONSTRAINTS } from '../license-constants'
import { LicenseError } from '../license-errors'

export class LicensedUnits extends IntegerValueObject {
  protected static override fieldName = 'Licensed units'

  private constructor(value: number) {
    super(value)
  }

  static create(value: number): LicensedUnits {
    this.ensureIsInteger(value)

    if (value < LICENSE_CONSTRAINTS.LICENSED_UNITS.MIN) {
      throw new LicenseError(`Licensed units must be at least ${LICENSE_CONSTRAINTS.LICENSED_UNITS.MIN}`)
    }

    return new LicensedUnits(value)
  }
}
