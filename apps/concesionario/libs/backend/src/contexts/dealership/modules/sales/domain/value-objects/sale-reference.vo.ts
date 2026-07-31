import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { SALE_CONSTRAINTS } from '../sale-constants'
import { SaleError } from '../sale-errors'

export class SaleReference extends StringValueObject {
  protected static override fieldName = 'Sale reference'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): SaleReference {
    this.ensureIsString(value)
    value = this.normalize(value)
    this.ensureHasNoInnerWhitespace(value)

    if (value.length < SALE_CONSTRAINTS.REFERENCE.MIN) {
      throw new SaleError(`Sale reference must be at least ${SALE_CONSTRAINTS.REFERENCE.MIN} characters`)
    }

    if (value.length > SALE_CONSTRAINTS.REFERENCE.MAX) {
      throw new SaleError(`Sale reference must be at most ${SALE_CONSTRAINTS.REFERENCE.MAX} characters`)
    }

    return new SaleReference(value)
  }
}
