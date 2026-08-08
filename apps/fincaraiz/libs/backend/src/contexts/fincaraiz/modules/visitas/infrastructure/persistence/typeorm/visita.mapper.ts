import { Visita } from '../../../domain/visita'
import { TypeOrmVisitaEntity } from './typeorm-visita.entity'

export class VisitaMapper {
  static toDomain(entity: TypeOrmVisitaEntity): Visita {
    return Visita.fromPrimitives({
      id: entity.id,
      referencia: entity.referencia,
      fecha: entity.fecha,
      interesado: entity.interesado,
      observaciones: entity.observaciones,
      confirmada: entity.confirmada,
      propiedadId: entity.propiedadId,
      propiedadName: entity.propiedadName
    })
  }

  static toPersistence(domain: Visita): TypeOrmVisitaEntity {
    const primitives = domain.toPrimitives()
    const entity = new TypeOrmVisitaEntity()
    entity.id = primitives.id
    entity.referencia = primitives.referencia
    entity.fecha = primitives.fecha
    entity.interesado = primitives.interesado
    entity.observaciones = primitives.observaciones
    entity.confirmada = primitives.confirmada
    entity.propiedadId = primitives.propiedadId
    entity.propiedadName = primitives.propiedadName

    return entity
  }

  // @ai:begin mapper-extra — transformaciones a medida (denormalizaciones, derivados)
  // @ai:end
}
