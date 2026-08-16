import { BusinessRuleViolationError } from '../../../../shared/domain/errors'

export class PuntoError extends BusinessRuleViolationError {
  constructor(message: string, cause?: unknown) {
    super(message, 'Punto', cause)
  }
}
