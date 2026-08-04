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
}
