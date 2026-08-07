import { InvalidArgumentError } from '../../../../shared/domain/errors'
import { normalizeSpanishLegalName } from '../../../../shared/domain/value-objects/spanish-legal-name'
import { StringValueObject } from '../../../../shared/domain/value-objects/string-value-object'
import { SHARED_CONSTRAINTS } from '../constants'

const ACRONYMS: readonly string[] = ['SAP', 'AG', 'NTT', 'ELIX', 'IBM', 'ERP']

export class CustomerName extends StringValueObject {
  protected static override fieldName = 'Customer name'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): CustomerName {
    this.ensureIsString(value)
    value = this.normalize(value)

    if (value.length < SHARED_CONSTRAINTS.CUSTOMER_NAME.MIN) {
      throw new InvalidArgumentError(
        `Customer name must be at least ${SHARED_CONSTRAINTS.CUSTOMER_NAME.MIN} characters`
      )
    }

    if (value.length > SHARED_CONSTRAINTS.CUSTOMER_NAME.MAX) {
      throw new InvalidArgumentError(`Customer name must be at most ${SHARED_CONSTRAINTS.CUSTOMER_NAME.MAX} characters`)
    }

    return new CustomerName(value)
  }

  /** Canonización del borde (el sync, el alta): create NO la aplica — rehidratar no reescribe. */
  static normalizeName(raw: string): string {
    return normalizeSpanishLegalName(raw, ACRONYMS)
  }
}
