import { AggregateRoot } from '../../../../shared/domain/aggregate-root'
import { Nullable, Undefinable } from '../../../../shared/domain/types'
import { VehicleId } from '../../../../shared/domain/value-objects/vehicles/vehicle-id.vo'
import {
  RegisterVehicleProps,
  VehicleAggregateProps,
  VehiclePrimitiveProps,
  VehicleUniquenessUpdateProps,
  VehicleUpdateProps
} from './vehicle-types'
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

export class Vehicle extends AggregateRoot {
  private constructor(
    private readonly _id: VehicleId,
    private _vin: Vin,
    private _brand: VehicleBrand,
    private _model: VehicleModel,
    private _version: VehicleVersion,
    private _plate: Plate,
    private _color: VehicleColor,
    private _fuel: FuelType,
    private _year: VehicleYear,
    private _mileage: Mileage,
    private _price: Price,
    private _status: VehicleStatus,
    private _notes: VehicleNotes
  ) {
    super()
  }

  //#region ...Getters...
  get id(): VehicleId {
    return this._id
  }
  get vin(): Vin {
    return this._vin
  }
  get brand(): VehicleBrand {
    return this._brand
  }
  get model(): VehicleModel {
    return this._model
  }
  get version(): VehicleVersion {
    return this._version
  }
  get plate(): Plate {
    return this._plate
  }
  get color(): VehicleColor {
    return this._color
  }
  get fuel(): FuelType {
    return this._fuel
  }
  get year(): VehicleYear {
    return this._year
  }
  get mileage(): Mileage {
    return this._mileage
  }
  get price(): Price {
    return this._price
  }
  get status(): VehicleStatus {
    return this._status
  }
  get notes(): VehicleNotes {
    return this._notes
  }
  //#endregion

  static create(props: VehicleAggregateProps): Vehicle {
    return new Vehicle(
      props.id,
      props.vin,
      props.brand,
      props.model,
      props.version,
      props.plate,
      props.color,
      props.fuel,
      props.year,
      props.mileage,
      props.price,
      props.status,
      props.notes
    )
  }

  static register(props: RegisterVehicleProps): Vehicle {
    return Vehicle.create({
      id: VehicleId.create(props.id),
      vin: Vin.create(props.vin),
      brand: VehicleBrand.create(props.brand),
      model: VehicleModel.create(props.model),
      version: VehicleVersion.create(props.version ?? ''),
      plate: Plate.create(props.plate ?? ''),
      color: VehicleColor.create(props.color ?? ''),
      fuel: FuelType.create(props.fuel),
      year: VehicleYear.create(props.year),
      mileage: Mileage.create(props.mileage),
      price: Price.create(props.price),
      status: VehicleStatus.create(props.status),
      notes: VehicleNotes.create(props.notes ?? '')
    })
  }

  static fromPrimitives(props: VehiclePrimitiveProps): Vehicle {
    return new Vehicle(
      VehicleId.create(props.id),
      Vin.create(props.vin),
      VehicleBrand.create(props.brand),
      VehicleModel.create(props.model),
      VehicleVersion.create(props.version),
      Plate.create(props.plate),
      VehicleColor.create(props.color),
      FuelType.create(props.fuel),
      VehicleYear.create(props.year),
      Mileage.create(props.mileage),
      Price.create(props.price),
      VehicleStatus.create(props.status),
      VehicleNotes.create(props.notes)
    )
  }

  toPrimitives(): VehiclePrimitiveProps {
    return {
      id: this._id.value,
      vin: this._vin.value,
      brand: this._brand.value,
      model: this._model.value,
      version: this._version.value,
      plate: this._plate.value,
      color: this._color.value,
      fuel: this._fuel.value,
      year: this._year.value,
      mileage: this._mileage.value,
      price: this._price.value,
      status: this._status.value,
      notes: this._notes.value
    }
  }

  updateDetails(updates: VehicleUpdateProps): void {
    if (updates.vin !== undefined) {
      this._vin = Vin.create(updates.vin)
    }
    if (updates.brand !== undefined) {
      this._brand = VehicleBrand.create(updates.brand)
    }
    if (updates.model !== undefined) {
      this._model = VehicleModel.create(updates.model)
    }
    if (updates.version !== undefined) {
      this._version = VehicleVersion.create(updates.version)
    }
    if (updates.plate !== undefined) {
      this._plate = Plate.create(updates.plate)
    }
    if (updates.color !== undefined) {
      this._color = VehicleColor.create(updates.color)
    }
    if (updates.fuel !== undefined) {
      this._fuel = FuelType.create(updates.fuel)
    }
    if (updates.year !== undefined) {
      this._year = VehicleYear.create(updates.year)
    }
    if (updates.mileage !== undefined) {
      this._mileage = Mileage.create(updates.mileage)
    }
    if (updates.price !== undefined) {
      this._price = Price.create(updates.price)
    }
    if (updates.status !== undefined) {
      this._status = VehicleStatus.create(updates.status)
    }
    if (updates.notes !== undefined) {
      this._notes = VehicleNotes.create(updates.notes)
    }
  }

  equals(other: AggregateRoot): boolean {
    if (!(other instanceof Vehicle)) {
      return false
    }
    return this._id.equals(other._id)
  }

  newVinIfChanged(updates: VehicleUniquenessUpdateProps): Undefinable<Vin> {
    if (!updates.vin) {
      return
    }

    const newVin = Vin.create(updates.vin)

    if (this._vin.equals(newVin)) {
      return
    }

    return newVin
  }

  newPlateIfChanged(updates: VehicleUniquenessUpdateProps): Undefinable<Plate> {
    if (!updates.plate) {
      return
    }

    const newPlate = Plate.create(updates.plate)

    if (this._plate.equals(newPlate)) {
      return
    }

    return newPlate
  }

  // @ai:begin domain-extra — métodos de negocio no derivables del schema
  // @ai:end
}
