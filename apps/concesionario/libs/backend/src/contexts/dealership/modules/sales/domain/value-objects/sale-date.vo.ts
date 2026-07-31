import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { SaleError } from '../sale-errors'

export class SaleDate extends StringValueObject {
  protected static override fieldName = 'Sale date'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): SaleDate {
    this.ensureIsDefined(value)
    value = this.normalize(value)

    return new SaleDate(value)
  }
}
