import { EnumValueObject } from '../../../../../shared/domain/value-objects/enum-value-object'

export type RenewalTypeValue = 'auto' | 'manual' | 'none'

export class RenewalType extends EnumValueObject<RenewalTypeValue> {
  protected static override fieldName = 'Renewal type'
  static readonly VALUES: readonly RenewalTypeValue[] = ['auto', 'manual', 'none']

  private constructor(value: RenewalTypeValue) {
    super(value)
  }

  static create(value: string): RenewalType {
    this.ensureIsValidEnum(value as RenewalTypeValue, this.VALUES)
    return new RenewalType(value as RenewalTypeValue)
  }
}
