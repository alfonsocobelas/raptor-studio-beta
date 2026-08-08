import { BusinessRuleViolationError } from '../../../../shared/domain/errors'

export class CustomerError extends BusinessRuleViolationError {
  constructor(message: string, cause?: unknown) {
    super(message, 'Customer', cause)
  }
}
