import { InvalidArgumentError } from '../errors'
import { ValueObject } from './value-object'

export abstract class DateValueObject extends ValueObject<Date> {
  constructor(value: Date) {
    super(value)
  }

  protected static ensureIsValidDate(value: Date): void {
    if (value === null || value === undefined) {
      throw new InvalidArgumentError(`${this.fieldName} must be defined`)
    }
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
      throw new InvalidArgumentError(`${this.fieldName} must be a valid date`)
    }
  }

  toDateString(): string {
    return this._value.toISOString().slice(0, 10)
  }

  isBefore(other: DateValueObject): boolean {
    return this._value.getTime() < other._value.getTime()
  }

  isSameOrAfter(other: DateValueObject): boolean {
    return this._value.getTime() >= other._value.getTime()
  }
}
