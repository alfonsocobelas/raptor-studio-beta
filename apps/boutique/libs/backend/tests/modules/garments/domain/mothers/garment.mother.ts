import { Garment } from '../../../../../src/contexts/warehouse/modules/garments/domain/garment'
import { GarmentPrimitiveProps } from '../../../../../src/contexts/warehouse/modules/garments/domain/garment-types'
import { GarmentBuilder } from './garment.builder'

export class GarmentMother {
  static random(): Garment {
    return GarmentBuilder.aGarment().build()
  }

  static randomList(count: number = 5): Garment[] {
    return Array.from({ length: count }, () => this.random())
  }

  static register(overrides?: Partial<GarmentPrimitiveProps>): Garment {
    return GarmentBuilder.aGarment().withProps(overrides).create()
  }

  static reconstruct(overrides?: Partial<GarmentPrimitiveProps>): Garment {
    return GarmentBuilder.aGarment().withProps(overrides).build()
  }

  static withSku(sku: string): Garment {
    return GarmentBuilder.aGarment().withSku(sku).build()
  }

  static primitives(overrides?: Partial<GarmentPrimitiveProps>): GarmentPrimitiveProps {
    return GarmentBuilder.aGarment().withProps(overrides).build().toPrimitives()
  }
}
