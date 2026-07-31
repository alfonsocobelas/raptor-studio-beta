import { InvalidArgumentError } from '../errors'

export abstract class ValueObject<T> {
  protected readonly _value: T
  protected static fieldName: string

  protected constructor(value: T) {
    this.ensureIsDefined(value)
    this._value = Object.freeze(value) as T
  }

  get value(): T {
    return this._value
  }

  equals(vo: ValueObject<T>): boolean {
    if (vo === null || vo === undefined) {
      return false
    }
    if (vo.constructor !== this.constructor) {
      return false
    }
    return JSON.stringify(this._value) === JSON.stringify(vo._value)
  }

  toString(): string {
    return String(this._value)
  }

  private ensureIsDefined(value: T): void {
    if (value === null || value === undefined) {
      throw new InvalidArgumentError(`[${this.constructor.name}] Value "${String(value)}" must be defined`)
    }
  }
}
