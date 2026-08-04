import { StringValueObject } from '../../value-objects/string-value-object'
import { BusinessRuleViolationError } from '../../errors'
import { MAX_ATTACHMENT_FILE_NAME_LENGTH } from '../attachment-constants'

class AttachmentError extends BusinessRuleViolationError {
  constructor(message: string) {
    super(message, 'Attachment')
  }
}

/** Nombre original del fichero subido. No vacío y acotado: va a base de datos y a la UI. */
export class AttachmentFileName extends StringValueObject {
  protected static override fieldName = 'Attachment file name'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): AttachmentFileName {
    this.ensureIsString(value)

    if (value.length > MAX_ATTACHMENT_FILE_NAME_LENGTH) {
      throw new AttachmentError(`Attachment file name must be at most ${MAX_ATTACHMENT_FILE_NAME_LENGTH} characters`)
    }

    return new AttachmentFileName(value)
  }
}
