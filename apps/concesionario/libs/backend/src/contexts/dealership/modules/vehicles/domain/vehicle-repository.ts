import { Nullable } from '../../../../shared/domain/types'
import { Criteria } from '../../../../shared/domain/query/criteria'
import { VehicleId } from '../../../../shared/domain/value-objects/vehicles/vehicle-id.vo'
import { Vin } from './value-objects/vin.vo'
import { Plate } from './value-objects/plate.vo'
import { Vehicle } from './vehicle'

export abstract class VehicleRepository {
  abstract register(vehicle: Vehicle): Promise<void>
  abstract save(vehicle: Vehicle): Promise<void>
  abstract remove(vehicleId: VehicleId): Promise<void>
  abstract get(vehicleId: VehicleId): Promise<Nullable<Vehicle>>
  abstract matching(criteria: Criteria): Promise<Vehicle[]>
  abstract findByVin(vin: Vin): Promise<Nullable<Vehicle>>
  abstract findByPlate(plate: Plate): Promise<Nullable<Vehicle>>
  abstract exists(criteria: Criteria): Promise<boolean>
  abstract count(criteria: Criteria): Promise<number>
  // @ai:begin port-extra — finders no derivables (sync, agregaciones)
  // @ai:end
}
