import { BusinessRuleViolationError } from '../../../../shared/domain/errors'

export class GarmentError extends BusinessRuleViolationError {
  constructor(message: string, cause?: unknown) {
    super(message, 'Garment', cause)
  }
}
