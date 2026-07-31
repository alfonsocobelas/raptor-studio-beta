import { Client } from '../../../domain/client'
import { TypeOrmClientEntity } from './typeorm-client.entity'

export class ClientMapper {
  static toDomain(entity: TypeOrmClientEntity): Client {
    return Client.fromPrimitives({
      id: entity.id,
      name: entity.name,
      clientType: entity.clientType,
      taxId: entity.taxId,
      email: entity.email,
      phone: entity.phone,
      city: entity.city,
      address: entity.address,
      notes: entity.notes
    })
  }

  static toPersistence(domain: Client): TypeOrmClientEntity {
    const primitives = domain.toPrimitives()
    const entity = new TypeOrmClientEntity()
    entity.id = primitives.id
    entity.name = primitives.name
    entity.clientType = primitives.clientType
    entity.taxId = primitives.taxId
    entity.email = primitives.email
    entity.phone = primitives.phone
    entity.city = primitives.city
    entity.address = primitives.address
    entity.notes = primitives.notes

    return entity
  }

  // @ai:begin mapper-extra — transformaciones a medida (denormalizaciones, derivados)
  // @ai:end
}
