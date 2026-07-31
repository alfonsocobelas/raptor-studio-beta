import { SalePrimitiveProps } from '../../domain/sale-types'

type SaleAllowedField = keyof SalePrimitiveProps

const SALE_ALLOWED_FILTERS: Array<SaleAllowedField> = [
  'id',
  'reference',
  'saleDate',
  'salesperson',
  'paymentMethod',
  'status'
] as const

const SALE_ALLOWED_ORDERS: Array<SaleAllowedField> = [
  'saleDate',
  'reference',
  'vehicleLabel',
  'clientLabel',
  'salesperson',
  'amount',
  'paymentMethod',
  'status'
] as const

const SALE_SEARCHABLE_FIELDS: Array<SaleAllowedField> = [
  'reference',
  'vehicleLabel',
  'clientLabel',
  'salesperson'
] as const

const searchSaleConfig = {
  allowedFilters: SALE_ALLOWED_FILTERS,
  allowedOrders: SALE_ALLOWED_ORDERS,
  searchableFields: SALE_SEARCHABLE_FIELDS
} as const

export default searchSaleConfig
