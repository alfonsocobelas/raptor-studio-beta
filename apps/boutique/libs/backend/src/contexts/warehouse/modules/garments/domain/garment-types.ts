import { Nullable } from '../../../../shared/domain/types'
import { GarmentId } from '../../../../shared/domain/value-objects/garments/garment-id.vo'
import { GarmentBrand } from './value-objects/garment-brand.vo'
import { GarmentCategory } from './value-objects/garment-category.vo'
import { GarmentColor } from './value-objects/garment-color.vo'
import { GarmentName } from './value-objects/garment-name.vo'
import { GarmentPrice } from './value-objects/garment-price.vo'
import { GarmentSize } from './value-objects/garment-size.vo'
import { GarmentStatus } from './value-objects/garment-status.vo'
import { Sku } from './value-objects/sku.vo'
import { StockUnits } from './value-objects/stock-units.vo'

export interface GarmentAggregateProps {
  id: GarmentId
  sku: Sku
  name: GarmentName
  category: GarmentCategory
  size: GarmentSize
  brand: GarmentBrand
  color: GarmentColor
  price: GarmentPrice
  stock: StockUnits
  status: GarmentStatus
}

export interface GarmentPrimitiveProps {
  id: string
  sku: string
  name: string
  category: string
  size: string
  brand: string
  color: string
  price: number
  stock: number
  status: string
}

export type GarmentUpdateProps = Partial<Omit<GarmentPrimitiveProps, 'id'>>

export type GarmentUniquenessUpdateProps = Pick<GarmentUpdateProps, 'sku'>

export interface RegisterGarmentProps {
  id: string
  sku: string
  name: string
  category: string
  size: string
  brand?: string
  color?: string
  price: number
  stock: number
  status: string
}
