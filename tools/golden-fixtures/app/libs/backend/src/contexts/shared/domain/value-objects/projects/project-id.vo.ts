import { UuidV7ValueObject } from '../uuidv7-value-object'

export class ProjectId extends UuidV7ValueObject {
  protected static override fieldName = 'Project ID'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): ProjectId {
    this.ensureIsValidUuidV7(value)
    return new ProjectId(value)
  }
}
