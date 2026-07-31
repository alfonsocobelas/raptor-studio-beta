import { Garment } from '../../../domain/garment'
import { TypeOrmGarmentEntity } from './typeorm-garment.entity'

export class GarmentMapper {
  static toDomain(entity: TypeOrmGarmentEntity): Garment {
    return Garment.fromPrimitives({
      id: entity.id,
      sku: entity.sku,
      name: entity.name,
      category: entity.category,
      size: entity.size,
      brand: entity.brand,
      color: entity.color,
      price: entity.price,
      stock: entity.stock,
      status: entity.status
    })
  }

  static toPersistence(domain: Garment): TypeOrmGarmentEntity {
    const primitives = domain.toPrimitives()
    const entity = new TypeOrmGarmentEntity()
    entity.id = primitives.id
    entity.sku = primitives.sku
    entity.name = primitives.name
    entity.category = primitives.category
    entity.size = primitives.size
    entity.brand = primitives.brand
    entity.color = primitives.color
    entity.price = primitives.price
    entity.stock = primitives.stock
    entity.status = primitives.status

    return entity
  }

  // @ai:begin mapper-extra — transformaciones a medida (denormalizaciones, derivados)
  // @ai:end
}
