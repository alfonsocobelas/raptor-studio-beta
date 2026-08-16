import { BusinessRuleViolationError } from '../../../../shared/domain/errors'

export class ClienteError extends BusinessRuleViolationError {
  constructor(message: string, cause?: unknown) {
    super(message, 'Cliente', cause)
  }
}
