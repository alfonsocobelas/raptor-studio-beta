import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { SALE_CONSTRAINTS } from '../sale-constants'
import { SaleError } from '../sale-errors'

export class SaleClientLabel extends StringValueObject {
  protected static override fieldName = 'Sale client'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): SaleClientLabel {
    this.ensureIsString(value)
    value = this.normalize(value)

    if (value.length < SALE_CONSTRAINTS.CLIENT_LABEL.MIN) {
      throw new SaleError(`Sale client must be at least ${SALE_CONSTRAINTS.CLIENT_LABEL.MIN} characters`)
    }

    if (value.length > SALE_CONSTRAINTS.CLIENT_LABEL.MAX) {
      throw new SaleError(`Sale client must be at most ${SALE_CONSTRAINTS.CLIENT_LABEL.MAX} characters`)
    }

    return new SaleClientLabel(value)
  }
}
