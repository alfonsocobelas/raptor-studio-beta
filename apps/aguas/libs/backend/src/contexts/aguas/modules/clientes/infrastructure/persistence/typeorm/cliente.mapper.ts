import { Cliente } from '../../../domain/cliente'
import { TypeOrmClienteEntity } from './typeorm-cliente.entity'

export class ClienteMapper {
  static toDomain(entity: TypeOrmClienteEntity): Cliente {
    return Cliente.fromPrimitives({
      id: entity.id,
      nombre: entity.nombre,
      tipo: entity.tipo,
      telefono: entity.telefono,
      localidad: entity.localidad
    })
  }

  static toPersistence(domain: Cliente): TypeOrmClienteEntity {
    const primitives = domain.toPrimitives()
    const entity = new TypeOrmClienteEntity()
    entity.id = primitives.id
    entity.nombre = primitives.nombre
    entity.tipo = primitives.tipo
    entity.telefono = primitives.telefono
    entity.localidad = primitives.localidad

    return entity
  }

  // @ai:begin mapper-extra — transformaciones a medida (denormalizaciones, derivados)
  // @ai:end
}
