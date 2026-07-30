import { BusinessRuleViolationError } from '../../../../shared/domain/errors'

export class MovementError extends BusinessRuleViolationError {
  constructor(message: string, cause?: unknown) {
    super(message, 'Movement', cause)
  }
}
