import { EnumValueObject } from '../../../../../shared/domain/value-objects/enum-value-object'

export type ContractTypeValue = 'cloud' | 'onprem' | 'mixed' | 'maintenance'

export class ContractType extends EnumValueObject<ContractTypeValue> {
  protected static override fieldName = 'Contract type'
  static readonly VALUES: readonly ContractTypeValue[] = ['cloud', 'onprem', 'mixed', 'maintenance']

  private constructor(value: ContractTypeValue) {
    super(value)
  }

  static create(value: string): ContractType {
    this.ensureIsValidEnum(value as ContractTypeValue, this.VALUES)
    return new ContractType(value as ContractTypeValue)
  }
}
