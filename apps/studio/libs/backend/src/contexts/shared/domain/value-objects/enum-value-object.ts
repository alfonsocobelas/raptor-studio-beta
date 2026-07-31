import { InvalidArgumentError } from '../errors'
import { ValueObject } from './value-object'

export abstract class EnumValueObject<T> extends ValueObject<T> {
  protected static ensureIsValidEnum<T>(value: T, validValues: readonly T[]): void {
    if (!validValues.includes(value)) {
      throw new InvalidArgumentError(`${this.fieldName} must be one of: ${validValues.join(', ')}`)
    }
  }
}
