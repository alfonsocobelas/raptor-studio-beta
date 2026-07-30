import { BusinessRuleViolationError } from '../../../../shared/domain/errors'

export class VehicleError extends BusinessRuleViolationError {
  constructor(message: string, cause?: unknown) {
    super(message, 'Vehicle', cause)
  }
}
