import { Nullable } from '../../../../shared/domain/types'
import { VehicleId } from '../../../../shared/domain/value-objects/vehicles/vehicle-id.vo'
import { FuelType } from './value-objects/fuel-type.vo'
import { Mileage } from './value-objects/mileage.vo'
import { Plate } from './value-objects/plate.vo'
import { Price } from './value-objects/price.vo'
import { VehicleBrand } from './value-objects/vehicle-brand.vo'
import { VehicleColor } from './value-objects/vehicle-color.vo'
import { VehicleModel } from './value-objects/vehicle-model.vo'
import { VehicleNotes } from './value-objects/vehicle-notes.vo'
import { VehicleStatus } from './value-objects/vehicle-status.vo'
import { VehicleVersion } from './value-objects/vehicle-version.vo'
import { VehicleYear } from './value-objects/vehicle-year.vo'
import { Vin } from './value-objects/vin.vo'

export interface VehicleAggregateProps {
  id: VehicleId
  vin: Vin
  brand: VehicleBrand
  model: VehicleModel
  version: VehicleVersion
  plate: Plate
  color: VehicleColor
  fuel: FuelType
  year: VehicleYear
  mileage: Mileage
  price: Price
  status: VehicleStatus
  notes: VehicleNotes
}

export interface VehiclePrimitiveProps {
  id: string
  vin: string
  brand: string
  model: string
  version: string
  plate: string
  color: string
  fuel: string
  year: number
  mileage: number
  price: number
  status: string
  notes: string
}

export type VehicleUpdateProps = Partial<Omit<VehiclePrimitiveProps, 'id'>>

export type VehicleUniquenessUpdateProps = Pick<VehicleUpdateProps, 'vin' | 'plate'>

export interface RegisterVehicleProps {
  id: string
  vin: string
  brand: string
  model: string
  version?: string
  plate?: string
  color?: string
  fuel: string
  year: number
  mileage: number
  price: number
  status: string
  notes?: string
}
