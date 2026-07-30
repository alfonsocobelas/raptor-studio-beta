import { Supplier } from '../../../domain/supplier'
import { TypeOrmSupplierEntity } from './typeorm-supplier.entity'

export class SupplierMapper {
  static toDomain(entity: TypeOrmSupplierEntity): Supplier {
    return Supplier.fromPrimitives({
      id: entity.id,
      name: entity.name,
      taxId: entity.taxId,
      email: entity.email,
      phone: entity.phone,
      city: entity.city,
      leadTimeDays: entity.leadTimeDays
    })
  }

  static toPersistence(domain: Supplier): TypeOrmSupplierEntity {
    const primitives = domain.toPrimitives()
    const entity = new TypeOrmSupplierEntity()
    entity.id = primitives.id
    entity.name = primitives.name
    entity.taxId = primitives.taxId
    entity.email = primitives.email
    entity.phone = primitives.phone
    entity.city = primitives.city
    entity.leadTimeDays = primitives.leadTimeDays

    return entity
  }

  // @ai:begin mapper-extra — transformaciones a medida (denormalizaciones, derivados)
  // @ai:end
}
