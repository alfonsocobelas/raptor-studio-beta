import { BusinessRuleViolationError } from '../../../../shared/domain/errors'

export class MuestraError extends BusinessRuleViolationError {
  constructor(message: string, cause?: unknown) {
    super(message, 'Muestra', cause)
  }
}
