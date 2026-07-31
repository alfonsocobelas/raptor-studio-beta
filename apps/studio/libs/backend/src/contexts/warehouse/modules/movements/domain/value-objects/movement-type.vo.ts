import { EnumValueObject } from '../../../../../shared/domain/value-objects/enum-value-object'

export type MovementTypeValue = 'in' | 'out'

export class MovementType extends EnumValueObject<MovementTypeValue> {
  protected static override fieldName = 'Movement type'
  static readonly VALUES: readonly MovementTypeValue[] = ['in', 'out']

  private constructor(value: MovementTypeValue) {
    super(value)
  }

  static create(value: string): MovementType {
    this.ensureIsValidEnum(value as MovementTypeValue, this.VALUES)
    return new MovementType(value as MovementTypeValue)
  }
}
