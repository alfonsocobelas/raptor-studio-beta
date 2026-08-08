import { BusinessRuleViolationError } from '../../../../shared/domain/errors'

export class AgenteError extends BusinessRuleViolationError {
  constructor(message: string, cause?: unknown) {
    super(message, 'Agente', cause)
  }
}
