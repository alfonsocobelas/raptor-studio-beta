import { EnumValueObject } from '../../../../../shared/domain/value-objects/enum-value-object'

export type LicenseSourceValue = 'ME_SAP' | 'MANUAL'

export class LicenseSource extends EnumValueObject<LicenseSourceValue> {
  protected static override fieldName = 'License source'
  static readonly VALUES: readonly LicenseSourceValue[] = ['ME_SAP', 'MANUAL']

  private constructor(value: LicenseSourceValue) {
    super(value)
  }

  static create(value: string): LicenseSource {
    this.ensureIsValidEnum(value as LicenseSourceValue, this.VALUES)
    return new LicenseSource(value as LicenseSourceValue)
  }

  static manual(): LicenseSource {
    return new LicenseSource('MANUAL')
  }

  isManual(): boolean {
    return this.value === 'MANUAL'
  }
}
