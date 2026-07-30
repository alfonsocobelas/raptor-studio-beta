import { InvalidArgumentError } from '../errors'
import { NumberValueObject } from './number-value-object'

export abstract class IntegerValueObject extends NumberValueObject {
  constructor(value: number) {
    super(value)
  }

  protected static ensureIsInteger(value: number): void {
    this.ensureIsNumber(value)

    if (!Number.isInteger(value)) {
      throw new InvalidArgumentError(`${this.fieldName} must be an integer`)
    }
  }
}
