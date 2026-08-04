import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { CONTRACT_CONSTRAINTS } from '../contract-constants'
import { ContractError } from '../contract-errors'

export class ContractNotes extends StringValueObject {
  protected static override fieldName = 'Contract notes'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): ContractNotes {
    this.ensureIsDefined(value)
    value = this.normalize(value)

    if (value.length > CONTRACT_CONSTRAINTS.NOTES.MAX) {
      throw new ContractError(`Contract notes must be at most ${CONTRACT_CONSTRAINTS.NOTES.MAX} characters`)
    }

    return new ContractNotes(value)
  }
}
