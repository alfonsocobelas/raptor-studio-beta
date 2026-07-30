import { BusinessRuleViolationError } from '../../../../shared/domain/errors'

export class UserError extends BusinessRuleViolationError {
  constructor(message: string, cause?: unknown) {
    super(message, 'User', cause)
  }
}

export class SessionError extends BusinessRuleViolationError {
  constructor(message: string, cause?: unknown) {
    super(message, 'Session', cause)
  }
}

export class AuthTokenError extends BusinessRuleViolationError {
  constructor(message: string, cause?: unknown) {
    super(message, 'AuthToken', cause)
  }
}
