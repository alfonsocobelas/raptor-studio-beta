import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { LICENSE_CONSTRAINTS } from '../license-constants'
import { LicenseError } from '../license-errors'

export class MetricName extends StringValueObject {
  protected static override fieldName = 'Metric name'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): MetricName {
    this.ensureIsString(value)
    value = this.normalize(value)

    if (value.length > LICENSE_CONSTRAINTS.METRIC_NAME.MAX) {
      throw new LicenseError(`Metric name must be at most ${LICENSE_CONSTRAINTS.METRIC_NAME.MAX} characters`)
    }

    return new MetricName(value)
  }
}
