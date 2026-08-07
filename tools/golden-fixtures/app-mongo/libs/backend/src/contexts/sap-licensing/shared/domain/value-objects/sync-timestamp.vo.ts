import { Nullable } from '../../../../shared/domain/types'
import { DateValueObject } from '../../../../shared/domain/value-objects/date-value-object'

export class SyncTimestamp extends DateValueObject {
  protected static override fieldName = 'Sync timestamp'

  private constructor(value: Date) {
    super(value)
  }

  static create(value: Date): SyncTimestamp {
    this.ensureIsValidDate(value)
    return new SyncTimestamp(value)
  }

  static fromISOString(value: string): SyncTimestamp {
    return this.create(new Date(value))
  }

  /** Named null: the timestamped event has never happened. */
  static never(): Nullable<SyncTimestamp> {
    return null
  }

  toISOString(): string {
    return this._value.toISOString()
  }
}
