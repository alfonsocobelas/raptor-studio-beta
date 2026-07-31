import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { LICENSE_CONSTRAINTS } from '../license-constants'
import { LicenseError } from '../license-errors'

export class SubSolutionAreaName extends StringValueObject {
  protected static override fieldName = 'Sub solution area name'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): SubSolutionAreaName {
    this.ensureIsDefined(value)
    value = this.normalize(value)

    if (value.length > LICENSE_CONSTRAINTS.SUB_SOLUTION_AREA_NAME.MAX) {
      throw new LicenseError(
        `Sub solution area name must be at most ${LICENSE_CONSTRAINTS.SUB_SOLUTION_AREA_NAME.MAX} characters`
      )
    }

    return new SubSolutionAreaName(value)
  }
}
