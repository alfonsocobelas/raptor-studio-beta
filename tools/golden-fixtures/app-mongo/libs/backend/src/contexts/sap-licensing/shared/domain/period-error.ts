import { BusinessRuleViolationError } from '../../../shared/domain/errors'

export class PeriodError extends BusinessRuleViolationError {
  constructor(message: string, cause?: unknown) {
    super(message, 'Period', cause)
  }
}
