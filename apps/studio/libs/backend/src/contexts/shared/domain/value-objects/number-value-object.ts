import { InvalidArgumentError } from '../errors'
import { ValueObject } from './value-object'

export abstract class NumberValueObject extends ValueObject<number> {
  constructor(value: number) {
    super(value)
  }

  protected static ensureIsNumber(value: number): void {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new InvalidArgumentError(`${this.fieldName} must be a valid number`)
    }
  }
}
