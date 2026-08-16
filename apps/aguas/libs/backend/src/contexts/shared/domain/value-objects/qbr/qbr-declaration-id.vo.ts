import { UuidV7ValueObject } from '../uuidv7-value-object'

export class QbrDeclarationId extends UuidV7ValueObject {
  protected static override fieldName = 'QBR declaration ID'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): QbrDeclarationId {
    this.ensureIsValidUuidV7(value)
    return new QbrDeclarationId(value)
  }
}
