import { IntegerValueObject } from '../../../../../shared/domain/value-objects/integer-value-object'
import { CONTRACT_CONSTRAINTS } from '../contract-constants'
import { ContractError } from '../contract-errors'

export class NumberOfContracts extends IntegerValueObject {
  protected static override fieldName = 'Number of contracts'

  private constructor(value: number) {
    super(value)
  }

  static create(value: number): NumberOfContracts {
    this.ensureIsInteger(value)

    if (value < CONTRACT_CONSTRAINTS.NBR_OF_CONTRACTS.MIN) {
      throw new ContractError(`Number of contracts must be at least ${CONTRACT_CONSTRAINTS.NBR_OF_CONTRACTS.MIN}`)
    }

    return new NumberOfContracts(value)
  }
}
