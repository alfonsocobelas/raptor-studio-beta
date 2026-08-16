import { Muestra } from '../../../domain/muestra'
import { TypeOrmMuestraEntity } from './typeorm-muestra.entity'

export class MuestraMapper {
  static toDomain(entity: TypeOrmMuestraEntity): Muestra {
    return Muestra.fromPrimitives({
      id: entity.id,
      codigo: entity.codigo,
      estado: entity.estado,
      tecnico: entity.tecnico,
      recogida: entity.recogida,
      limiteInforme: entity.limiteInforme,
      importe: entity.importe,
      puntoId: entity.puntoId,
      puntoName: entity.puntoName
    })
  }

  static toPersistence(domain: Muestra): TypeOrmMuestraEntity {
    const primitives = domain.toPrimitives()
    const entity = new TypeOrmMuestraEntity()
    entity.id = primitives.id
    entity.codigo = primitives.codigo
    entity.estado = primitives.estado
    entity.tecnico = primitives.tecnico
    entity.recogida = primitives.recogida
    entity.limiteInforme = primitives.limiteInforme
    entity.importe = primitives.importe
    entity.puntoId = primitives.puntoId
    entity.puntoName = primitives.puntoName

    return entity
  }

  // @ai:begin mapper-extra — transformaciones a medida (denormalizaciones, derivados)
  // @ai:end
}
