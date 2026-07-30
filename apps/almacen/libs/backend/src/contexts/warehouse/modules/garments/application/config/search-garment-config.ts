import { GarmentPrimitiveProps } from '../../domain/garment-types'

type GarmentAllowedField = keyof GarmentPrimitiveProps

const GARMENT_ALLOWED_FILTERS: Array<GarmentAllowedField> = [
  'id',
  'sku',
  'name',
  'category',
  'size',
  'brand',
  'status'
] as const

const GARMENT_ALLOWED_ORDERS: Array<GarmentAllowedField> = [
  'name',
  'sku',
  'category',
  'brand',
  'price',
  'stock'
] as const

const GARMENT_SEARCHABLE_FIELDS: Array<GarmentAllowedField> = ['name', 'sku', 'brand', 'color'] as const

const searchGarmentConfig = {
  allowedFilters: GARMENT_ALLOWED_FILTERS,
  allowedOrders: GARMENT_ALLOWED_ORDERS,
  searchableFields: GARMENT_SEARCHABLE_FIELDS
} as const

export default searchGarmentConfig
