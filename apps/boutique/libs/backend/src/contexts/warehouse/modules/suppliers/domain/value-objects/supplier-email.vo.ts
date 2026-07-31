import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { SUPPLIER_CONSTRAINTS } from '../supplier-constants'
import { SupplierError } from '../supplier-errors'

export class SupplierEmail extends StringValueObject {
  protected static override fieldName = 'Supplier email'

  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): SupplierEmail {
    this.ensureIsDefined(value)
    value = this.normalize(value)

    if (value.length > SUPPLIER_CONSTRAINTS.EMAIL.MAX) {
      throw new SupplierError(`Supplier email must be at most ${SUPPLIER_CONSTRAINTS.EMAIL.MAX} characters`)
    }

    if (value !== '' && !SupplierEmail.EMAIL_REGEX.test(value)) {
      throw new SupplierError('Supplier email format is invalid')
    }

    return new SupplierEmail(value)
  }
}
