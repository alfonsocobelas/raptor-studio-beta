import { EnumValueObject } from '../../../../../shared/domain/value-objects/enum-value-object'

export type ContractOriginValue = 'ME_SAP' | 'MANUAL'

export class ContractOrigin extends EnumValueObject<ContractOriginValue> {
  protected static override fieldName = 'Contract origin'
  static readonly VALUES: readonly ContractOriginValue[] = ['ME_SAP', 'MANUAL']

  private constructor(value: ContractOriginValue) {
    super(value)
  }

  static create(value: string): ContractOrigin {
    this.ensureIsValidEnum(value as ContractOriginValue, this.VALUES)
    return new ContractOrigin(value as ContractOriginValue)
  }
}
