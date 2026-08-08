import { Propiedad } from '../../../domain/propiedad'
import { TypeOrmPropiedadEntity } from './typeorm-propiedad.entity'

export class PropiedadMapper {
  static toDomain(entity: TypeOrmPropiedadEntity): Propiedad {
    return Propiedad.fromPrimitives({
      id: entity.id,
      titulo: entity.titulo,
      zona: entity.zona,
      estado: entity.estado,
      metrosCuadrados: entity.metrosCuadrados,
      habitaciones: entity.habitaciones,
      precio: entity.precio,
      fechaAlta: entity.fechaAlta,
      exclusiva: entity.exclusiva,
      agenteId: entity.agenteId,
      agenteName: entity.agenteName
    })
  }

  static toPersistence(domain: Propiedad): TypeOrmPropiedadEntity {
    const primitives = domain.toPrimitives()
    const entity = new TypeOrmPropiedadEntity()
    entity.id = primitives.id
    entity.titulo = primitives.titulo
    entity.zona = primitives.zona
    entity.estado = primitives.estado
    entity.metrosCuadrados = primitives.metrosCuadrados
    entity.habitaciones = primitives.habitaciones
    entity.precio = primitives.precio
    entity.fechaAlta = primitives.fechaAlta
    entity.exclusiva = primitives.exclusiva
    entity.agenteId = primitives.agenteId
    entity.agenteName = primitives.agenteName

    return entity
  }

  // @ai:begin mapper-extra — transformaciones a medida (denormalizaciones, derivados)
  // @ai:end
}
