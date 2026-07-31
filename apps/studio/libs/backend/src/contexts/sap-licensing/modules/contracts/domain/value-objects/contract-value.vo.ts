import { Nullable } from '../../../../../shared/domain/types'
import { NumberValueObject } from '../../../../../shared/domain/value-objects/number-value-object'
import { CONTRACT_CONSTRAINTS } from '../contract-constants'
import { ContractError } from '../contract-errors'

export class ContractValue extends NumberValueObject {
  protected static override fieldName = 'Contract value'

  private constructor(value: number) {
    super(value)
  }

  static create(value: number): ContractValue {
    this.ensureIsNumber(value)

    if (value < CONTRACT_CONSTRAINTS.TOTAL_VALUE.MIN) {
      throw new ContractError(`Contract value must be at least ${CONTRACT_CONSTRAINTS.TOTAL_VALUE.MIN}`)
    }

    return new ContractValue(value)
  }

  static unset(): Nullable<ContractValue> {
    return null
  }
}
