import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { SALE_CONSTRAINTS } from '../sale-constants'
import { SaleError } from '../sale-errors'

export class Salesperson extends StringValueObject {
  protected static override fieldName = 'Salesperson'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): Salesperson {
    this.ensureIsDefined(value)
    value = this.normalize(value)

    if (value.length > SALE_CONSTRAINTS.SALESPERSON.MAX) {
      throw new SaleError(`Salesperson must be at most ${SALE_CONSTRAINTS.SALESPERSON.MAX} characters`)
    }

    return new Salesperson(value)
  }
}
