import http from 'http-status'
import { BaseCustomError, BusinessRuleViolationError } from '../../../../shared/domain/errors'

export class ContractError extends BusinessRuleViolationError {
  constructor(message: string, cause?: unknown) {
    super(message, 'Contract', cause)
  }
}

/** Transición ilegal de la máquina de estados (spec 43): la petición es válida, es el
 *  estado quien la rechaza — CONFLICT, no 422. */
export class ContractInvalidTransitionError extends BaseCustomError {
  constructor(message: string, cause?: unknown) {
    super(`[Contract]: ${message}`, http.CONFLICT, cause)
  }
}
