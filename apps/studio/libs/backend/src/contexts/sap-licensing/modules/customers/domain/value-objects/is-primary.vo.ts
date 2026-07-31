import { BooleanValueObject } from '../../../../../shared/domain/value-objects/boolean-value-object'

export class IsPrimary extends BooleanValueObject {
  protected static override fieldName = 'Is primary'

  private constructor(value: boolean) {
    super(value)
  }

  static create(value: boolean): IsPrimary {
    this.ensureIsBoolean(value)
    return new IsPrimary(value)
  }
}
