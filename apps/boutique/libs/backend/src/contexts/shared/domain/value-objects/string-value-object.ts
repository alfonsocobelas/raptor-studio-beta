import { InvalidArgumentError } from '../errors'
import { ValueObject } from './value-object'

export abstract class StringValueObject extends ValueObject<string> {
  constructor(value: string) {
    super(value)
  }

  isEmpty(): boolean {
    return this._value.trim().length === 0
  }

  protected static ensureIsString(value: string): void {
    if (value === null || value === undefined || !value.trim().length) {
      throw new InvalidArgumentError(`${this.fieldName} cannot be empty`)
    }
  }

  protected static ensureIsDefined(value: string): void {
    if (value === null || value === undefined) {
      throw new InvalidArgumentError(`${this.fieldName} must be defined`)
    }
  }

  protected static normalize(value: string): string {
    return value.trim()
  }

  protected static ensureHasNoInnerWhitespace(value: string): void {
    if (/\s/.test(value.trim())) {
      throw new InvalidArgumentError(`${this.fieldName} cannot contain whitespace`)
    }
  }
}
