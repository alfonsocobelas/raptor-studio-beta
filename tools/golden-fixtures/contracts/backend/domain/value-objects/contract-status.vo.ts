import { EnumValueObject } from '../../../../../shared/domain/value-objects/enum-value-object'

export type ContractStatusValue = 'active' | 'expiring' | 'expired' | 'terminated'

export class ContractStatus extends EnumValueObject<ContractStatusValue> {
  protected static override fieldName = 'Contract status'
  static readonly VALUES: readonly ContractStatusValue[] = ['active', 'expiring', 'expired', 'terminated']

  private constructor(value: ContractStatusValue) {
    super(value)
  }

  static create(value: string): ContractStatus {
    this.ensureIsValidEnum(value as ContractStatusValue, this.VALUES)
    return new ContractStatus(value as ContractStatusValue)
  }

  /** El valor con el que nace la entidad (máquina de estados, spec 43). */
  static initial(): ContractStatus {
    return new ContractStatus('active')
  }

  static active(): ContractStatus {
    return new ContractStatus('active')
  }

  static expiring(): ContractStatus {
    return new ContractStatus('expiring')
  }

  static expired(): ContractStatus {
    return new ContractStatus('expired')
  }

  static terminated(): ContractStatus {
    return new ContractStatus('terminated')
  }

  isActive(): boolean {
    return this.value === 'active'
  }

  isExpiring(): boolean {
    return this.value === 'expiring'
  }

  isExpired(): boolean {
    return this.value === 'expired'
  }

  isTerminated(): boolean {
    return this.value === 'terminated'
  }
}
