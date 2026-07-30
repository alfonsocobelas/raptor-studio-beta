import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { LICENSE_CONSTRAINTS } from '../license-constants'
import { LicenseError } from '../license-errors'

export class MetricId extends StringValueObject {
  protected static override fieldName = 'Metric ID'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): MetricId {
    this.ensureIsDefined(value)
    value = this.normalize(value)
    this.ensureHasNoInnerWhitespace(value)

    if (value.length > LICENSE_CONSTRAINTS.METRIC_ID.MAX) {
      throw new LicenseError(`Metric ID must be at most ${LICENSE_CONSTRAINTS.METRIC_ID.MAX} characters`)
    }

    return new MetricId(value)
  }
}
