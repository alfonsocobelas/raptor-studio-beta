import { SupplierPrimitiveProps } from '../../domain/supplier-types'

type SupplierAllowedField = keyof SupplierPrimitiveProps

const SUPPLIER_ALLOWED_FILTERS: Array<SupplierAllowedField> = ['id', 'name', 'taxId', 'city'] as const

const SUPPLIER_ALLOWED_ORDERS: Array<SupplierAllowedField> = ['name', 'city', 'leadTimeDays'] as const

const SUPPLIER_SEARCHABLE_FIELDS: Array<SupplierAllowedField> = ['name', 'taxId', 'email', 'phone', 'city'] as const

const searchSupplierConfig = {
  allowedFilters: SUPPLIER_ALLOWED_FILTERS,
  allowedOrders: SUPPLIER_ALLOWED_ORDERS,
  searchableFields: SUPPLIER_SEARCHABLE_FIELDS
} as const

export default searchSupplierConfig
