import { Session } from '../../../domain/session'
import { TypeOrmSessionEntity } from './typeorm-session.entity'

export class SessionMapper {
  static toDomain(entity: TypeOrmSessionEntity): Session {
    return Session.fromPrimitives({
      id: entity.id,
      userId: entity.userId,
      tokenHash: entity.tokenHash,
      createdAt: entity.createdAt,
      expiresAt: entity.expiresAt,
      lastSeenAt: entity.lastSeenAt
    })
  }

  static toPersistence(domain: Session): TypeOrmSessionEntity {
    const primitives = domain.toPrimitives()
    const entity = new TypeOrmSessionEntity()
    entity.id = primitives.id
    entity.userId = primitives.userId
    entity.tokenHash = primitives.tokenHash
    entity.createdAt = primitives.createdAt
    entity.expiresAt = primitives.expiresAt
    entity.lastSeenAt = primitives.lastSeenAt
    return entity
  }
}
