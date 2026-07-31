import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { AUTH_CONSTRAINTS } from '../auth-constants'
import { UserError } from '../auth-errors'

const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export class Email extends StringValueObject {
  protected static override fieldName = 'Email'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): Email {
    this.ensureIsString(value)
    const normalized = value.trim().toLowerCase()
    if (normalized.length > AUTH_CONSTRAINTS.EMAIL.MAX) {
      throw new UserError(`Email must be at most ${AUTH_CONSTRAINTS.EMAIL.MAX} characters`)
    }
    if (!EMAIL_FORMAT.test(normalized)) {
      throw new UserError('Email format is invalid')
    }
    return new Email(normalized)
  }
}
