import { EnumValueObject } from '../../../../../shared/domain/value-objects/enum-value-object'

export type ContractSourceValue = 'AVVALE_SOLD' | 'CUSTOMER_OWNED'

export class ContractSource extends EnumValueObject<ContractSourceValue> {
  protected static override fieldName = 'Contract source'
  static readonly VALUES: readonly ContractSourceValue[] = ['AVVALE_SOLD', 'CUSTOMER_OWNED']

  private constructor(value: ContractSourceValue) {
    super(value)
  }

  static create(value: string): ContractSource {
    this.ensureIsValidEnum(value as ContractSourceValue, this.VALUES)
    return new ContractSource(value as ContractSourceValue)
  }
}
