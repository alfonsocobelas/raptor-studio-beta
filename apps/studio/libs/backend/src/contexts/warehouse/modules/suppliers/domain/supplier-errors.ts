import { BusinessRuleViolationError } from '../../../../shared/domain/errors'

export class SupplierError extends BusinessRuleViolationError {
  constructor(message: string, cause?: unknown) {
    super(message, 'Supplier', cause)
  }
}
