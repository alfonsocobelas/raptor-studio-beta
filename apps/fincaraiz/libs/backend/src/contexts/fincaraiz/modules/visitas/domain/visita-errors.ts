import { BusinessRuleViolationError } from '../../../../shared/domain/errors'

export class VisitaError extends BusinessRuleViolationError {
  constructor(message: string, cause?: unknown) {
    super(message, 'Visita', cause)
  }
}
