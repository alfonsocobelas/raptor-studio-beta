import { v7 as uuidv7 } from 'uuid'
import { Garment } from '../../../../../src/contexts/warehouse/modules/garments/domain/garment'
import { GarmentPrimitiveProps } from '../../../../../src/contexts/warehouse/modules/garments/domain/garment-types'
import { GarmentBrand } from '../../../../../src/contexts/warehouse/modules/garments/domain/value-objects/garment-brand.vo'
import { GarmentCategory } from '../../../../../src/contexts/warehouse/modules/garments/domain/value-objects/garment-category.vo'
import { GarmentColor } from '../../../../../src/contexts/warehouse/modules/garments/domain/value-objects/garment-color.vo'
import { GarmentName } from '../../../../../src/contexts/warehouse/modules/garments/domain/value-objects/garment-name.vo'
import { GarmentPrice } from '../../../../../src/contexts/warehouse/modules/garments/domain/value-objects/garment-price.vo'
import { GarmentSize } from '../../../../../src/contexts/warehouse/modules/garments/domain/value-objects/garment-size.vo'
import { GarmentStatus } from '../../../../../src/contexts/warehouse/modules/garments/domain/value-objects/garment-status.vo'
import { Sku } from '../../../../../src/contexts/warehouse/modules/garments/domain/value-objects/sku.vo'
import { StockUnits } from '../../../../../src/contexts/warehouse/modules/garments/domain/value-objects/stock-units.vo'
import { GarmentId } from '../../../../../src/contexts/shared/domain/value-objects/garments/garment-id.vo'

const randomSku = (): string => String(Math.floor(1000000000 + Math.random() * 9000000000))

export class GarmentBuilder {
  private props: GarmentPrimitiveProps = {
    id: uuidv7(),
    sku: randomSku(),
    name: 'Name 1',
    category: 'tshirt',
    size: 'XS',
    brand: '',
    color: '',
    price: 0,
    stock: 0,
    status: 'active'
  }

  static aGarment(): GarmentBuilder {
    return new GarmentBuilder()
  }

  withId(id: string): GarmentBuilder {
    this.props.id = id
    return this
  }

  withSku(sku: string): GarmentBuilder {
    this.props.sku = sku
    return this
  }

  withCategory(category: string): GarmentBuilder {
    this.props.category = category
    return this
  }

  withSize(size: string): GarmentBuilder {
    this.props.size = size
    return this
  }

  withStatus(status: string): GarmentBuilder {
    this.props.status = status
    return this
  }

  withProps(overrides?: Partial<GarmentPrimitiveProps>): GarmentBuilder {
    this.props = { ...this.props, ...overrides }
    return this
  }

  create(): Garment {
    return Garment.create({
      id: GarmentId.create(this.props.id),
      sku: Sku.create(this.props.sku),
      name: GarmentName.create(this.props.name),
      category: GarmentCategory.create(this.props.category),
      size: GarmentSize.create(this.props.size),
      brand: GarmentBrand.create(this.props.brand),
      color: GarmentColor.create(this.props.color),
      price: GarmentPrice.create(this.props.price),
      stock: StockUnits.create(this.props.stock),
      status: GarmentStatus.create(this.props.status)
    })
  }

  build(): Garment {
    return Garment.fromPrimitives(this.props)
  }
}
