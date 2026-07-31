import { BusinessRuleViolationError } from '../../../../shared/domain/errors'

export class ContractError extends BusinessRuleViolationError {
  constructor(message: string, cause?: unknown) {
    super(message, 'Contract', cause)
  }
}
