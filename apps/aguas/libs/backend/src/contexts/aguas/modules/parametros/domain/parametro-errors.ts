import { BusinessRuleViolationError } from '../../../../shared/domain/errors'

export class ParametroError extends BusinessRuleViolationError {
  constructor(message: string, cause?: unknown) {
    super(message, 'Parametro', cause)
  }
}
