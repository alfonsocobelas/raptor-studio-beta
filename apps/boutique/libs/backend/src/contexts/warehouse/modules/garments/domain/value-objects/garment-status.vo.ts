import { EnumValueObject } from '../../../../../shared/domain/value-objects/enum-value-object'

export type GarmentStatusValue = 'active' | 'discontinued'

export class GarmentStatus extends EnumValueObject<GarmentStatusValue> {
  protected static override fieldName = 'Garment status'
  static readonly VALUES: readonly GarmentStatusValue[] = ['active', 'discontinued']

  private constructor(value: GarmentStatusValue) {
    super(value)
  }

  static create(value: string): GarmentStatus {
    this.ensureIsValidEnum(value as GarmentStatusValue, this.VALUES)
    return new GarmentStatus(value as GarmentStatusValue)
  }
}
