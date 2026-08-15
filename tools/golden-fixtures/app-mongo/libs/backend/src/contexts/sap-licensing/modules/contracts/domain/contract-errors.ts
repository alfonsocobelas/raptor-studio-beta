import { BusinessRuleViolationError } from '../../../../shared/domain/errors'

export class ContractError extends BusinessRuleViolationError {
  constructor(message: string, cause?: unknown) {
    super(message, 'Contract', cause)
  }
}

/** Transición ilegal de la máquina de estados (spec 43): el borde la mapea a 409. */
export class ContractInvalidTransitionError extends BusinessRuleViolationError {
  constructor(message: string, cause?: unknown) {
    super(message, 'Contract', cause)
  }
}
