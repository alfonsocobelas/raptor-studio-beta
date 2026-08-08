import { Agente } from '../../../domain/agente'
import { TypeOrmAgenteEntity } from './typeorm-agente.entity'

export class AgenteMapper {
  static toDomain(entity: TypeOrmAgenteEntity): Agente {
    return Agente.fromPrimitives({
      id: entity.id,
      nombre: entity.nombre,
      email: entity.email,
      telefono: entity.telefono,
      comisionPorcentaje: entity.comisionPorcentaje,
      activo: entity.activo
    })
  }

  static toPersistence(domain: Agente): TypeOrmAgenteEntity {
    const primitives = domain.toPrimitives()
    const entity = new TypeOrmAgenteEntity()
    entity.id = primitives.id
    entity.nombre = primitives.nombre
    entity.email = primitives.email
    entity.telefono = primitives.telefono
    entity.comisionPorcentaje = primitives.comisionPorcentaje
    entity.activo = primitives.activo

    return entity
  }

  // @ai:begin mapper-extra — transformaciones a medida (denormalizaciones, derivados)
  // @ai:end
}
