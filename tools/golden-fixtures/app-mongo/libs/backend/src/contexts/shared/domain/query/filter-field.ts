import { StringValueObject } from '../value-objects/string-value-object'

export class FilterField extends StringValueObject {
  private constructor(value: string) {
    super(value)
  }

  static create(value: string): FilterField {
    FilterField.ensureIsString(value)
    return new FilterField(value)
  }
}
