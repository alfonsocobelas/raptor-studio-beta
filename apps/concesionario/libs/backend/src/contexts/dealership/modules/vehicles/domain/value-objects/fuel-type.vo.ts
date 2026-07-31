import { EnumValueObject } from '../../../../../shared/domain/value-objects/enum-value-object'

export type FuelTypeValue = 'gasoline' | 'diesel' | 'hybrid' | 'electric'

export class FuelType extends EnumValueObject<FuelTypeValue> {
  protected static override fieldName = 'Fuel type'
  static readonly VALUES: readonly FuelTypeValue[] = ['gasoline', 'diesel', 'hybrid', 'electric']

  private constructor(value: FuelTypeValue) {
    super(value)
  }

  static create(value: string): FuelType {
    this.ensureIsValidEnum(value as FuelTypeValue, this.VALUES)
    return new FuelType(value as FuelTypeValue)
  }
}
