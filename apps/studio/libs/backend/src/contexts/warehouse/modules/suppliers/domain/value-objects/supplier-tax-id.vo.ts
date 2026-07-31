import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { SUPPLIER_CONSTRAINTS } from '../supplier-constants'
import { SupplierError } from '../supplier-errors'

export class SupplierTaxId extends StringValueObject {
  protected static override fieldName = 'Tax ID'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): SupplierTaxId {
    this.ensureIsDefined(value)
    value = this.normalize(value)
    this.ensureHasNoInnerWhitespace(value)

    if (value.length > SUPPLIER_CONSTRAINTS.TAX_ID.MAX) {
      throw new SupplierError(`Tax ID must be at most ${SUPPLIER_CONSTRAINTS.TAX_ID.MAX} characters`)
    }

    return new SupplierTaxId(value)
  }
}
