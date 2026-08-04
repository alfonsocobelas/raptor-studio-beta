import { UuidV7ValueObject } from '../../../../../shared/domain/value-objects/uuidv7-value-object'

export class ContactId extends UuidV7ValueObject {
  protected static override fieldName = 'Contact ID'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): ContactId {
    this.ensureIsValidUuidV7(value)
    return new ContactId(value)
  }
}
