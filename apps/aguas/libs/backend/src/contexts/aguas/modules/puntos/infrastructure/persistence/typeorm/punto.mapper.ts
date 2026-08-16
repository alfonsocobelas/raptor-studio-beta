import { Punto } from '../../../domain/punto'
import { TypeOrmPuntoEntity } from './typeorm-punto.entity'

export class PuntoMapper {
  static toDomain(entity: TypeOrmPuntoEntity): Punto {
    return Punto.fromPrimitives({
      id: entity.id,
      nombre: entity.nombre,
      tipoAgua: entity.tipoAgua,
      direccion: entity.direccion,
      coordenadas: entity.coordenadas,
      obligatorio: entity.obligatorio,
      clienteId: entity.clienteId,
      clienteName: entity.clienteName
    })
  }

  static toPersistence(domain: Punto): TypeOrmPuntoEntity {
    const primitives = domain.toPrimitives()
    const entity = new TypeOrmPuntoEntity()
    entity.id = primitives.id
    entity.nombre = primitives.nombre
    entity.tipoAgua = primitives.tipoAgua
    entity.direccion = primitives.direccion
    entity.coordenadas = primitives.coordenadas
    entity.obligatorio = primitives.obligatorio
    entity.clienteId = primitives.clienteId
    entity.clienteName = primitives.clienteName

    return entity
  }

  // @ai:begin mapper-extra — transformaciones a medida (denormalizaciones, derivados)
  // @ai:end
}
