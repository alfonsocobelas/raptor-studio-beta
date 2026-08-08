import { IntegerValueObject } from '../../value-objects/integer-value-object'
import { BusinessRuleViolationError } from '../../errors'
import { MAX_ATTACHMENT_SIZE_BYTES } from '../attachment-constants'

class AttachmentError extends BusinessRuleViolationError {
  constructor(message: string) {
    super(message, 'Attachment')
  }
}

/** Tamaño del fichero en bytes: entero, mayor que cero y por debajo del máximo compartido. */
export class AttachmentSizeBytes extends IntegerValueObject {
  protected static override fieldName = 'Attachment size'

  private constructor(value: number) {
    super(value)
  }

  static create(value: number): AttachmentSizeBytes {
    this.ensureIsInteger(value)

    if (value <= 0) {
      throw new AttachmentError('Attachment size must be greater than 0 bytes')
    }
    if (value > MAX_ATTACHMENT_SIZE_BYTES) {
      throw new AttachmentError(`Attachment size must be at most ${MAX_ATTACHMENT_SIZE_BYTES} bytes`)
    }

    return new AttachmentSizeBytes(value)
  }
}
