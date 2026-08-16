import { Parametro } from '../../../domain/parametro'
import { TypeOrmParametroEntity } from './typeorm-parametro.entity'

export class ParametroMapper {
  static toDomain(entity: TypeOrmParametroEntity): Parametro {
    return Parametro.fromPrimitives({
      id: entity.id,
      codigo: entity.codigo,
      nombre: entity.nombre,
      metodo: entity.metodo,
      limiteLegal: entity.limiteLegal,
      precio: entity.precio
    })
  }

  static toPersistence(domain: Parametro): TypeOrmParametroEntity {
    const primitives = domain.toPrimitives()
    const entity = new TypeOrmParametroEntity()
    entity.id = primitives.id
    entity.codigo = primitives.codigo
    entity.nombre = primitives.nombre
    entity.metodo = primitives.metodo
    entity.limiteLegal = primitives.limiteLegal
    entity.precio = primitives.precio

    return entity
  }

  // @ai:begin mapper-extra — transformaciones a medida (denormalizaciones, derivados)
  // @ai:end
}
