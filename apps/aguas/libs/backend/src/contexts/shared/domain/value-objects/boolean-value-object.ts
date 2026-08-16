import { InvalidArgumentError } from '../errors'
import { ValueObject } from './value-object'

export abstract class BooleanValueObject extends ValueObject<boolean> {
  constructor(value: boolean) {
    super(value)
  }

  protected static ensureIsBoolean(value: boolean): void {
    if (typeof value !== 'boolean') {
      throw new InvalidArgumentError(`${this.fieldName} must be a boolean`)
    }
  }
}
