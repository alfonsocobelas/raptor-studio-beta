import { BusinessRuleViolationError } from '../../../../shared/domain/errors'

export class ProjectError extends BusinessRuleViolationError {
  constructor(message: string, cause?: unknown) {
    super(message, 'Project', cause)
  }
}
