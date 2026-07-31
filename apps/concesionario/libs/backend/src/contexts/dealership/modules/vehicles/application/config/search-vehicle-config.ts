import { VehiclePrimitiveProps } from '../../domain/vehicle-types'

type VehicleAllowedField = keyof VehiclePrimitiveProps

const VEHICLE_ALLOWED_FILTERS: Array<VehicleAllowedField> = [
  'id',
  'vin',
  'brand',
  'model',
  'plate',
  'fuel',
  'year',
  'status'
] as const

const VEHICLE_ALLOWED_ORDERS: Array<VehicleAllowedField> = [
  'brand',
  'model',
  'year',
  'mileage',
  'vin',
  'plate',
  'fuel',
  'price',
  'status'
] as const

const VEHICLE_SEARCHABLE_FIELDS: Array<VehicleAllowedField> = [
  'brand',
  'model',
  'version',
  'vin',
  'plate',
  'color'
] as const

const searchVehicleConfig = {
  allowedFilters: VEHICLE_ALLOWED_FILTERS,
  allowedOrders: VEHICLE_ALLOWED_ORDERS,
  searchableFields: VEHICLE_SEARCHABLE_FIELDS
} as const

export default searchVehicleConfig
