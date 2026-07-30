import { EnumValueObject } from '../../../../../shared/domain/value-objects/enum-value-object'

export type MovementReasonValue = 'purchase' | 'sale' | 'return' | 'adjustment'

export class MovementReason extends EnumValueObject<MovementReasonValue> {
  protected static override fieldName = 'Movement reason'
  static readonly VALUES: readonly MovementReasonValue[] = ['purchase', 'sale', 'return', 'adjustment']

  private constructor(value: MovementReasonValue) {
    super(value)
  }

  static create(value: string): MovementReason {
    this.ensureIsValidEnum(value as MovementReasonValue, this.VALUES)
    return new MovementReason(value as MovementReasonValue)
  }
}
