import { v7 as uuidv7 } from 'uuid'
import { Vehicle } from '../../../../../src/contexts/dealership/modules/vehicles/domain/vehicle'
import { VehiclePrimitiveProps } from '../../../../../src/contexts/dealership/modules/vehicles/domain/vehicle-types'
import { FuelType } from '../../../../../src/contexts/dealership/modules/vehicles/domain/value-objects/fuel-type.vo'
import { Mileage } from '../../../../../src/contexts/dealership/modules/vehicles/domain/value-objects/mileage.vo'
import { Plate } from '../../../../../src/contexts/dealership/modules/vehicles/domain/value-objects/plate.vo'
import { Price } from '../../../../../src/contexts/dealership/modules/vehicles/domain/value-objects/price.vo'
import { VehicleBrand } from '../../../../../src/contexts/dealership/modules/vehicles/domain/value-objects/vehicle-brand.vo'
import { VehicleColor } from '../../../../../src/contexts/dealership/modules/vehicles/domain/value-objects/vehicle-color.vo'
import { VehicleModel } from '../../../../../src/contexts/dealership/modules/vehicles/domain/value-objects/vehicle-model.vo'
import { VehicleNotes } from '../../../../../src/contexts/dealership/modules/vehicles/domain/value-objects/vehicle-notes.vo'
import { VehicleStatus } from '../../../../../src/contexts/dealership/modules/vehicles/domain/value-objects/vehicle-status.vo'
import { VehicleVersion } from '../../../../../src/contexts/dealership/modules/vehicles/domain/value-objects/vehicle-version.vo'
import { VehicleYear } from '../../../../../src/contexts/dealership/modules/vehicles/domain/value-objects/vehicle-year.vo'
import { Vin } from '../../../../../src/contexts/dealership/modules/vehicles/domain/value-objects/vin.vo'
import { VehicleId } from '../../../../../src/contexts/shared/domain/value-objects/vehicles/vehicle-id.vo'

const randomVin = (): string => String(Math.floor(10000000000 + Math.random() * 90000000000))

const randomPlate = (): string => String(Math.floor(1000000000 + Math.random() * 9000000000))

export class VehicleBuilder {
  private props: VehiclePrimitiveProps = {
    id: uuidv7(),
    vin: randomVin(),
    brand: 'Brand 1',
    model: 'Model 1',
    version: '',
    plate: randomPlate(),
    color: '',
    fuel: 'gasoline',
    year: 1990,
    mileage: 0,
    price: 0,
    status: 'stock',
    notes: ''
  }

  static aVehicle(): VehicleBuilder {
    return new VehicleBuilder()
  }

  withId(id: string): VehicleBuilder {
    this.props.id = id
    return this
  }

  withVin(vin: string): VehicleBuilder {
    this.props.vin = vin
    return this
  }

  withPlate(plate: string): VehicleBuilder {
    this.props.plate = plate
    return this
  }

  withFuel(fuel: string): VehicleBuilder {
    this.props.fuel = fuel
    return this
  }

  withStatus(status: string): VehicleBuilder {
    this.props.status = status
    return this
  }

  withProps(overrides?: Partial<VehiclePrimitiveProps>): VehicleBuilder {
    this.props = { ...this.props, ...overrides }
    return this
  }

  create(): Vehicle {
    return Vehicle.create({
      id: VehicleId.create(this.props.id),
      vin: Vin.create(this.props.vin),
      brand: VehicleBrand.create(this.props.brand),
      model: VehicleModel.create(this.props.model),
      version: VehicleVersion.create(this.props.version),
      plate: Plate.create(this.props.plate),
      color: VehicleColor.create(this.props.color),
      fuel: FuelType.create(this.props.fuel),
      year: VehicleYear.create(this.props.year),
      mileage: Mileage.create(this.props.mileage),
      price: Price.create(this.props.price),
      status: VehicleStatus.create(this.props.status),
      notes: VehicleNotes.create(this.props.notes)
    })
  }

  build(): Vehicle {
    return Vehicle.fromPrimitives(this.props)
  }
}
