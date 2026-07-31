import { EnumValueObject } from '../../../../../shared/domain/value-objects/enum-value-object'

export type VehicleStatusValue = 'stock' | 'reserved' | 'sold' | 'workshop'

export class VehicleStatus extends EnumValueObject<VehicleStatusValue> {
  protected static override fieldName = 'Vehicle status'
  static readonly VALUES: readonly VehicleStatusValue[] = ['stock', 'reserved', 'sold', 'workshop']

  private constructor(value: VehicleStatusValue) {
    super(value)
  }

  static create(value: string): VehicleStatus {
    this.ensureIsValidEnum(value as VehicleStatusValue, this.VALUES)
    return new VehicleStatus(value as VehicleStatusValue)
  }
}
