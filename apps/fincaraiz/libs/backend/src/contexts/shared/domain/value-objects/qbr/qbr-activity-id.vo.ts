import { UuidV7ValueObject } from '../uuidv7-value-object'

export class QbrActivityId extends UuidV7ValueObject {
  protected static override fieldName = 'QBR activity ID'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): QbrActivityId {
    this.ensureIsValidUuidV7(value)
    return new QbrActivityId(value)
  }
}
