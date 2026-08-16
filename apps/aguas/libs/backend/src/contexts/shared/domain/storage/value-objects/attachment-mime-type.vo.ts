import { EnumValueObject } from '../../value-objects/enum-value-object'
import { ALLOWED_ATTACHMENT_MIME_TYPES } from '../attachment-constants'

type AttachmentMimeTypeValue = (typeof ALLOWED_ATTACHMENT_MIME_TYPES)[number]

/**
 * Tipo de fichero permitido. Es una ALLOWLIST a propósito: con una lista de prohibidos, cualquier
 * formato nuevo entraría por defecto.
 */
export class AttachmentMimeType extends EnumValueObject<AttachmentMimeTypeValue> {
  protected static override fieldName = 'Attachment MIME type'
  static readonly VALUES: readonly AttachmentMimeTypeValue[] = ALLOWED_ATTACHMENT_MIME_TYPES

  private constructor(value: AttachmentMimeTypeValue) {
    super(value)
  }

  static create(value: string): AttachmentMimeType {
    this.ensureIsValidEnum(value as AttachmentMimeTypeValue, this.VALUES)

    return new AttachmentMimeType(value as AttachmentMimeTypeValue)
  }
}
