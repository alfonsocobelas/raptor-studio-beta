import { EnumValueObject } from '../../../../../shared/domain/value-objects/enum-value-object'

export type LicenseStatusValue = 'active' | 'suspended' | 'expired'

export class LicenseStatus extends EnumValueObject<LicenseStatusValue> {
  protected static override fieldName = 'License status'
  static readonly VALUES: readonly LicenseStatusValue[] = ['active', 'suspended', 'expired']

  private constructor(value: LicenseStatusValue) {
    super(value)
  }

  static create(value: string): LicenseStatus {
    this.ensureIsValidEnum(value as LicenseStatusValue, this.VALUES)
    return new LicenseStatus(value as LicenseStatusValue)
  }
}
