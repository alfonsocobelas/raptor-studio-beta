import { spanishTitleCase } from '../../../../../shared/domain/value-objects/spanish-title-case'
import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { CUSTOMER_CONSTRAINTS } from '../customer-constants'
import { CustomerError } from '../customer-errors'

export class CustomerCity extends StringValueObject {
  protected static override fieldName = 'Customer city'

  private constructor(value: string) {
    super(value)
  }

  /**
   * El feed de SAP entrega el municipio en capitalización arbitraria ("MADRID" junto a "Madrid"),
   * lo que partía el mismo municipio en dos valores al filtrar y agrupar. Se normaliza a title case
   * de es-ES en la escritura, no al mostrar: es un dato de negocio, no una preferencia de vista.
   */
  protected static override normalize(value: string): string {
    return spanishTitleCase(value)
  }

  static create(value: string): CustomerCity {
    this.ensureIsDefined(value)
    value = this.normalize(value)

    if (value.length > CUSTOMER_CONSTRAINTS.CITY.MAX) {
      throw new CustomerError(`Customer city must be at most ${CUSTOMER_CONSTRAINTS.CITY.MAX} characters`)
    }

    return new CustomerCity(value)
  }
}
