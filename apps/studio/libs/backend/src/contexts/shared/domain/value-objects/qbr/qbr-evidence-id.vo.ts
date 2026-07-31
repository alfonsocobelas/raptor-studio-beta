import { UuidV7ValueObject } from '../uuidv7-value-object'

export class QbrEvidenceId extends UuidV7ValueObject {
  protected static override fieldName = 'QBR evidence ID'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): QbrEvidenceId {
    this.ensureIsValidUuidV7(value)
    return new QbrEvidenceId(value)
  }
}
