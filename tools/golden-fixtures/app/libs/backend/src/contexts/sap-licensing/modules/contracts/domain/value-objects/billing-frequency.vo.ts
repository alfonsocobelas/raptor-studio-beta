import { EnumValueObject } from '../../../../../shared/domain/value-objects/enum-value-object'

export type BillingFrequencyValue = 'monthly' | 'quarterly' | 'semiannual' | 'yearly'

export class BillingFrequency extends EnumValueObject<BillingFrequencyValue> {
  protected static override fieldName = 'Billing frequency'
  static readonly VALUES: readonly BillingFrequencyValue[] = ['monthly', 'quarterly', 'semiannual', 'yearly']

  private constructor(value: BillingFrequencyValue) {
    super(value)
  }

  static create(value: string): BillingFrequency {
    this.ensureIsValidEnum(value as BillingFrequencyValue, this.VALUES)
    return new BillingFrequency(value as BillingFrequencyValue)
  }
}
