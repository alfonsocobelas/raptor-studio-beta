import { Vehicle } from '../../../domain/vehicle'
import { TypeOrmVehicleEntity } from './typeorm-vehicle.entity'

export class VehicleMapper {
  static toDomain(entity: TypeOrmVehicleEntity): Vehicle {
    return Vehicle.fromPrimitives({
      id: entity.id,
      vin: entity.vin,
      brand: entity.brand,
      model: entity.model,
      version: entity.version,
      plate: entity.plate,
      color: entity.color,
      fuel: entity.fuel,
      year: entity.year,
      mileage: entity.mileage,
      price: entity.price,
      status: entity.status,
      notes: entity.notes
    })
  }

  static toPersistence(domain: Vehicle): TypeOrmVehicleEntity {
    const primitives = domain.toPrimitives()
    const entity = new TypeOrmVehicleEntity()
    entity.id = primitives.id
    entity.vin = primitives.vin
    entity.brand = primitives.brand
    entity.model = primitives.model
    entity.version = primitives.version
    entity.plate = primitives.plate
    entity.color = primitives.color
    entity.fuel = primitives.fuel
    entity.year = primitives.year
    entity.mileage = primitives.mileage
    entity.price = primitives.price
    entity.status = primitives.status
    entity.notes = primitives.notes

    return entity
  }

  // @ai:begin mapper-extra — transformaciones a medida (denormalizaciones, derivados)
  // @ai:end
}
