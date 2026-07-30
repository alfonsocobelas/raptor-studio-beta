import { Movement } from '../../../domain/movement'
import { TypeOrmMovementEntity } from './typeorm-movement.entity'

export class MovementMapper {
  static toDomain(entity: TypeOrmMovementEntity): Movement {
    return Movement.fromPrimitives({
      id: entity.id,
      reference: entity.reference,
      movementDate: entity.movementDate,
      movementType: entity.movementType,
      garmentLabel: entity.garmentLabel,
      quantity: entity.quantity,
      counterparty: entity.counterparty,
      reason: entity.reason
    })
  }

  static toPersistence(domain: Movement): TypeOrmMovementEntity {
    const primitives = domain.toPrimitives()
    const entity = new TypeOrmMovementEntity()
    entity.id = primitives.id
    entity.reference = primitives.reference
    entity.movementDate = primitives.movementDate
    entity.movementType = primitives.movementType
    entity.garmentLabel = primitives.garmentLabel
    entity.quantity = primitives.quantity
    entity.counterparty = primitives.counterparty
    entity.reason = primitives.reason

    return entity
  }

  // @ai:begin mapper-extra — transformaciones a medida (denormalizaciones, derivados)
  // @ai:end
}
