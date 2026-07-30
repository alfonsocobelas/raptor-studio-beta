import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { SUPPLIER_CONSTRAINTS } from '../supplier-constants'
import { SupplierError } from '../supplier-errors'

export class SupplierCity extends StringValueObject {
  protected static override fieldName = 'Supplier city'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): SupplierCity {
    this.ensureIsDefined(value)
    value = this.normalize(value)

    if (value.length > SUPPLIER_CONSTRAINTS.CITY.MAX) {
      throw new SupplierError(`Supplier city must be at most ${SUPPLIER_CONSTRAINTS.CITY.MAX} characters`)
    }

    return new SupplierCity(value)
  }
}
