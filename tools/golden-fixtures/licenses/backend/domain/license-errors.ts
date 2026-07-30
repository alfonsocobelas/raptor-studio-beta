import { BusinessRuleViolationError } from '../../../../shared/domain/errors'

export class LicenseError extends BusinessRuleViolationError {
  constructor(message: string, cause?: unknown) {
    super(message, 'License', cause)
  }
}
