import { BooleanValueObject } from '../../../../../shared/domain/value-objects/boolean-value-object'

export class IsFavorite extends BooleanValueObject {
  protected static override fieldName = 'Is favorite'

  private constructor(value: boolean) {
    super(value)
  }

  static create(value: boolean): IsFavorite {
    this.ensureIsBoolean(value)
    return new IsFavorite(value)
  }
}
