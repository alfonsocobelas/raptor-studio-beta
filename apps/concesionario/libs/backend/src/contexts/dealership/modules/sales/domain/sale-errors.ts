import { BusinessRuleViolationError } from '../../../../shared/domain/errors'

export class SaleError extends BusinessRuleViolationError {
  constructor(message: string, cause?: unknown) {
    super(message, 'Sale', cause)
  }
}
