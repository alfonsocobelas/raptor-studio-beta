import { BusinessRuleViolationError } from '../../../../shared/domain/errors'

export class ClientError extends BusinessRuleViolationError {
  constructor(message: string, cause?: unknown) {
    super(message, 'Client', cause)
  }
}
