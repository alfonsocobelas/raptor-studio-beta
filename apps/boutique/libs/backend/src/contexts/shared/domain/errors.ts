import http from 'http-status'

export class BaseCustomError extends Error {
  status: number
  override cause?: unknown

  constructor(message: string, status: number = http.INTERNAL_SERVER_ERROR, cause?: unknown) {
    super(message)
    Object.setPrototypeOf(this, new.target.prototype)
    this.name = new.target.name
    this.status = status
    this.cause = cause
    const captureStackTrace = (Error as unknown as { captureStackTrace?: (t: object, c: unknown) => void })
      .captureStackTrace
    if (captureStackTrace) {
      captureStackTrace(this, this.constructor)
    }
  }

  getResponse() {
    return { name: this.name, message: this.message }
  }

  getStatus() {
    return this.status
  }
}

export class InvalidArgumentError extends BaseCustomError {
  constructor(message = 'Invalid argument error', cause?: unknown) {
    super(message, http.BAD_REQUEST, cause)
  }
}

export class EntityNotFoundError extends BaseCustomError {
  constructor(entity: string, id: string, cause?: unknown) {
    super(`${entity} with id "${id}" not found.`, http.NOT_FOUND, cause)
  }
}

export class AlreadyExistsError extends BaseCustomError {
  constructor(entity: string, field: string, value: string, cause?: unknown) {
    super(`${entity} with ${field} "${value}" already exists.`, http.CONFLICT, cause)
  }
}

export abstract class BusinessRuleViolationError extends BaseCustomError {
  constructor(message = 'Domain validation error', entityName: string, cause?: unknown) {
    super(`[${entityName}]: ${message}`, http.UNPROCESSABLE_ENTITY, cause)
  }
}

export class InvalidRequestError extends BaseCustomError {
  constructor(message = 'Invalid request data', cause?: unknown) {
    super(message, http.BAD_REQUEST, cause)
  }
}

export class UnauthorizedError extends BaseCustomError {
  constructor(message = 'Unauthorized', cause?: unknown) {
    super(message, http.UNAUTHORIZED, cause)
  }
}

export class ForbiddenError extends BaseCustomError {
  constructor(message = 'Forbidden', cause?: unknown) {
    super(message, http.FORBIDDEN, cause)
  }
}

export class ExportTooLargeError extends BaseCustomError {
  constructor(count: number, limit: number, cause?: unknown) {
    super(
      `Export of ${count} rows exceeds the maximum of ${limit}. Please narrow the filters.`,
      http.REQUEST_ENTITY_TOO_LARGE,
      cause
    )
  }
}

export class AzureKeyVaultError extends BaseCustomError {
  constructor(message: string, status: number = http.INTERNAL_SERVER_ERROR, cause?: unknown) {
    super(message, status, cause)
  }
}

export class TelemetryInitError extends BaseCustomError {
  constructor(message: string, cause?: unknown) {
    super(message, http.INTERNAL_SERVER_ERROR, cause)
  }
}
