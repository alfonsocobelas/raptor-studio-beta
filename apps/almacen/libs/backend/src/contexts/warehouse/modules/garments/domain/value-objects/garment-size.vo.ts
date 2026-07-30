import { EnumValueObject } from '../../../../../shared/domain/value-objects/enum-value-object'

export type GarmentSizeValue = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'unique'

export class GarmentSize extends EnumValueObject<GarmentSizeValue> {
  protected static override fieldName = 'Garment size'
  static readonly VALUES: readonly GarmentSizeValue[] = ['XS', 'S', 'M', 'L', 'XL', 'unique']

  private constructor(value: GarmentSizeValue) {
    super(value)
  }

  static create(value: string): GarmentSize {
    this.ensureIsValidEnum(value as GarmentSizeValue, this.VALUES)
    return new GarmentSize(value as GarmentSizeValue)
  }
}
