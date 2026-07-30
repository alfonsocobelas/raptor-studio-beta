import { UuidV7ValueObject } from '../uuidv7-value-object'

export class SyncRunId extends UuidV7ValueObject {
  protected static override fieldName = 'Sync run ID'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): SyncRunId {
    this.ensureIsValidUuidV7(value)
    return new SyncRunId(value)
  }
}
