import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { SUPPLIER_CONSTRAINTS } from '../supplier-constants'
import { SupplierError } from '../supplier-errors'

export class SupplierName extends StringValueObject {
  protected static override fieldName = 'Supplier name'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): SupplierName {
    this.ensureIsString(value)
    value = this.normalize(value)

    if (value.length < SUPPLIER_CONSTRAINTS.NAME.MIN) {
      throw new SupplierError(`Supplier name must be at least ${SUPPLIER_CONSTRAINTS.NAME.MIN} characters`)
    }

    if (value.length > SUPPLIER_CONSTRAINTS.NAME.MAX) {
      throw new SupplierError(`Supplier name must be at most ${SUPPLIER_CONSTRAINTS.NAME.MAX} characters`)
    }

    return new SupplierName(value)
  }
}
