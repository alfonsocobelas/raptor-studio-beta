import { EnumValueObject } from '../../../../../shared/domain/value-objects/enum-value-object'

export type LicenseMetricValue = 'FUE' | 'user' | 'document' | 'transaction' | 'custom'

export class LicenseMetric extends EnumValueObject<LicenseMetricValue> {
  protected static override fieldName = 'License metric'
  static readonly VALUES: readonly LicenseMetricValue[] = ['FUE', 'user', 'document', 'transaction', 'custom']

  private constructor(value: LicenseMetricValue) {
    super(value)
  }

  static create(value: string): LicenseMetric {
    this.ensureIsValidEnum(value as LicenseMetricValue, this.VALUES)
    return new LicenseMetric(value as LicenseMetricValue)
  }
}
