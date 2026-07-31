import { EnumValueObject } from '../../../../../shared/domain/value-objects/enum-value-object'

export type LicenseLifecycleStatusValue = 'active' | 'archived'

export class LicenseLifecycleStatus extends EnumValueObject<LicenseLifecycleStatusValue> {
  protected static override fieldName = 'License lifecycle status'
  static readonly VALUES: readonly LicenseLifecycleStatusValue[] = ['active', 'archived']

  private constructor(value: LicenseLifecycleStatusValue) {
    super(value)
  }

  static create(value: string): LicenseLifecycleStatus {
    this.ensureIsValidEnum(value as LicenseLifecycleStatusValue, this.VALUES)
    return new LicenseLifecycleStatus(value as LicenseLifecycleStatusValue)
  }
}
