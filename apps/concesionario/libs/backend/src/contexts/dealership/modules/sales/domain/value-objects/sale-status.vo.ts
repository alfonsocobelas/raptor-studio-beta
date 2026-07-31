import { EnumValueObject } from '../../../../../shared/domain/value-objects/enum-value-object'

export type SaleStatusValue = 'pending' | 'delivered' | 'cancelled'

export class SaleStatus extends EnumValueObject<SaleStatusValue> {
  protected static override fieldName = 'Sale status'
  static readonly VALUES: readonly SaleStatusValue[] = ['pending', 'delivered', 'cancelled']

  private constructor(value: SaleStatusValue) {
    super(value)
  }

  static create(value: string): SaleStatus {
    this.ensureIsValidEnum(value as SaleStatusValue, this.VALUES)
    return new SaleStatus(value as SaleStatusValue)
  }
}
