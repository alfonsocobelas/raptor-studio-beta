import { Vehicle } from '../../../../../src/contexts/dealership/modules/vehicles/domain/vehicle'
import { VehiclePrimitiveProps } from '../../../../../src/contexts/dealership/modules/vehicles/domain/vehicle-types'
import { VehicleBuilder } from './vehicle.builder'

export class VehicleMother {
  static random(): Vehicle {
    return VehicleBuilder.aVehicle().build()
  }

  static randomList(count: number = 5): Vehicle[] {
    return Array.from({ length: count }, () => this.random())
  }

  static register(overrides?: Partial<VehiclePrimitiveProps>): Vehicle {
    return VehicleBuilder.aVehicle().withProps(overrides).create()
  }

  static reconstruct(overrides?: Partial<VehiclePrimitiveProps>): Vehicle {
    return VehicleBuilder.aVehicle().withProps(overrides).build()
  }

  static withVin(vin: string): Vehicle {
    return VehicleBuilder.aVehicle().withVin(vin).build()
  }

  static withPlate(plate: string): Vehicle {
    return VehicleBuilder.aVehicle().withPlate(plate).build()
  }

  static primitives(overrides?: Partial<VehiclePrimitiveProps>): VehiclePrimitiveProps {
    return VehicleBuilder.aVehicle().withProps(overrides).build().toPrimitives()
  }
}
