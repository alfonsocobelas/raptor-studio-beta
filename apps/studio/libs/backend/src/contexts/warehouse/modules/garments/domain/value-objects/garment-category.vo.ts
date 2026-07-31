import { EnumValueObject } from '../../../../../shared/domain/value-objects/enum-value-object'

export type GarmentCategoryValue = 'tshirt' | 'trousers' | 'dress' | 'jacket' | 'accessory'

export class GarmentCategory extends EnumValueObject<GarmentCategoryValue> {
  protected static override fieldName = 'Garment category'
  static readonly VALUES: readonly GarmentCategoryValue[] = ['tshirt', 'trousers', 'dress', 'jacket', 'accessory']

  private constructor(value: GarmentCategoryValue) {
    super(value)
  }

  static create(value: string): GarmentCategory {
    this.ensureIsValidEnum(value as GarmentCategoryValue, this.VALUES)
    return new GarmentCategory(value as GarmentCategoryValue)
  }
}
