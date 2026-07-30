import { EnumValueObject } from '../../../../../shared/domain/value-objects/enum-value-object'

export type ContractLifecycleStatusValue = 'active' | 'archived'

export class ContractLifecycleStatus extends EnumValueObject<ContractLifecycleStatusValue> {
  protected static override fieldName = 'Contract lifecycle status'
  static readonly VALUES: readonly ContractLifecycleStatusValue[] = ['active', 'archived']

  private constructor(value: ContractLifecycleStatusValue) {
    super(value)
  }

  static create(value: string): ContractLifecycleStatus {
    this.ensureIsValidEnum(value as ContractLifecycleStatusValue, this.VALUES)
    return new ContractLifecycleStatus(value as ContractLifecycleStatusValue)
  }

  static active(): ContractLifecycleStatus {
    return new ContractLifecycleStatus('active')
  }

  static archived(): ContractLifecycleStatus {
    return new ContractLifecycleStatus('archived')
  }

  isActive(): boolean {
    return this.value === 'active'
  }

  isArchived(): boolean {
    return this.value === 'archived'
  }
}
