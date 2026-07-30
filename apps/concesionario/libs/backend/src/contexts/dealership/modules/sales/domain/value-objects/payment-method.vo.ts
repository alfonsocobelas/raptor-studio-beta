import { EnumValueObject } from '../../../../../shared/domain/value-objects/enum-value-object'

export type PaymentMethodValue = 'cash' | 'financing' | 'leasing'

export class PaymentMethod extends EnumValueObject<PaymentMethodValue> {
  protected static override fieldName = 'Payment method'
  static readonly VALUES: readonly PaymentMethodValue[] = ['cash', 'financing', 'leasing']

  private constructor(value: PaymentMethodValue) {
    super(value)
  }

  static create(value: string): PaymentMethod {
    this.ensureIsValidEnum(value as PaymentMethodValue, this.VALUES)
    return new PaymentMethod(value as PaymentMethodValue)
  }
}
