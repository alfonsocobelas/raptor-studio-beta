import { InvalidArgumentError } from '../../../../shared/domain/errors'
import { StringValueObject } from '../../../../shared/domain/value-objects/string-value-object'
import { SHARED_CONSTRAINTS } from '../constants'

export class ContractNumber extends StringValueObject {
  protected static override fieldName = 'Contract number'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): ContractNumber {
    this.ensureIsString(value)
    value = this.normalize(value)
    this.ensureHasNoInnerWhitespace(value)

    if (value.length < SHARED_CONSTRAINTS.CONTRACT_NUMBER.MIN) {
      throw new InvalidArgumentError(
        `Contract number must be at least ${SHARED_CONSTRAINTS.CONTRACT_NUMBER.MIN} characters`
      )
    }

    if (value.length > SHARED_CONSTRAINTS.CONTRACT_NUMBER.MAX) {
      throw new InvalidArgumentError(
        `Contract number must be at most ${SHARED_CONSTRAINTS.CONTRACT_NUMBER.MAX} characters`
      )
    }

    return new ContractNumber(value)
  }
}
