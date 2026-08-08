import { BusinessRuleViolationError } from '../../../../shared/domain/errors'

export class PropiedadError extends BusinessRuleViolationError {
  constructor(message: string, cause?: unknown) {
    super(message, 'Propiedad', cause)
  }
}
