import { EnumValueObject } from '../../../../../shared/domain/value-objects/enum-value-object'

export type CustomerTypeValue = 'cloud' | 'onprem' | 'hybrid'

export class CustomerType extends EnumValueObject<CustomerTypeValue> {
  protected static override fieldName = 'Customer type'
  static readonly VALUES: readonly CustomerTypeValue[] = ['cloud', 'onprem', 'hybrid']

  private constructor(value: CustomerTypeValue) {
    super(value)
  }

  static create(value: string): CustomerType {
    this.ensureIsValidEnum(value as CustomerTypeValue, this.VALUES)
    return new CustomerType(value as CustomerTypeValue)
  }
}
