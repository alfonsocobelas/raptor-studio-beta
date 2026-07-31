import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { SUPPLIER_CONSTRAINTS } from '../supplier-constants'
import { SupplierError } from '../supplier-errors'

export class SupplierPhone extends StringValueObject {
  protected static override fieldName = 'Supplier phone'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): SupplierPhone {
    this.ensureIsDefined(value)
    value = this.normalize(value)

    if (value.length > SUPPLIER_CONSTRAINTS.PHONE.MAX) {
      throw new SupplierError(`Supplier phone must be at most ${SUPPLIER_CONSTRAINTS.PHONE.MAX} characters`)
    }

    return new SupplierPhone(value)
  }
}
