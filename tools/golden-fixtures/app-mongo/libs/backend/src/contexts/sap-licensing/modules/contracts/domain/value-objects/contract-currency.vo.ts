import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { CONTRACT_CONSTRAINTS } from '../contract-constants'
import { ContractError } from '../contract-errors'

export class ContractCurrency extends StringValueObject {
  protected static override fieldName = 'Contract currency'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): ContractCurrency {
    this.ensureIsString(value)
    value = this.normalize(value)
    this.ensureHasNoInnerWhitespace(value)

    if (value.length !== CONTRACT_CONSTRAINTS.CURRENCY.LENGTH) {
      throw new ContractError(`Contract currency must be a ${CONTRACT_CONSTRAINTS.CURRENCY.LENGTH}-letter ISO code`)
    }

    return new ContractCurrency(value)
  }
}
