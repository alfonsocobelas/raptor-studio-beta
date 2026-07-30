import { EnumValueObject } from '../../../../../shared/domain/value-objects/enum-value-object'

export type CustomerStatusValue = 'active' | 'archived'

export class CustomerStatus extends EnumValueObject<CustomerStatusValue> {
  protected static override fieldName = 'Customer status'
  static readonly VALUES: readonly CustomerStatusValue[] = ['active', 'archived']

  private constructor(value: CustomerStatusValue) {
    super(value)
  }

  static create(value: string): CustomerStatus {
    this.ensureIsValidEnum(value as CustomerStatusValue, this.VALUES)
    return new CustomerStatus(value as CustomerStatusValue)
  }

  static active(): CustomerStatus {
    return new CustomerStatus('active')
  }

  static archived(): CustomerStatus {
    return new CustomerStatus('archived')
  }

  isActive(): boolean {
    return this.value === 'active'
  }

  isArchived(): boolean {
    return this.value === 'archived'
  }
}
