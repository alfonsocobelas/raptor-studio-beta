import { AuthTokenPrimitiveProps } from '../../../domain/auth-types'
import { AuthToken } from '../../../domain/auth-token'
import { TypeOrmAuthTokenEntity } from './typeorm-auth-token.entity'

export class AuthTokenMapper {
  static toDomain(entity: TypeOrmAuthTokenEntity): AuthToken {
    return AuthToken.fromPrimitives({
      id: entity.id,
      userId: entity.userId,
      tokenHash: entity.tokenHash,
      type: entity.type as AuthTokenPrimitiveProps['type'],
      expiresAt: entity.expiresAt,
      usedAt: entity.usedAt,
      createdAt: entity.createdAt
    })
  }

  static toPersistence(domain: AuthToken): TypeOrmAuthTokenEntity {
    const primitives = domain.toPrimitives()
    const entity = new TypeOrmAuthTokenEntity()
    entity.id = primitives.id
    entity.userId = primitives.userId
    entity.tokenHash = primitives.tokenHash
    entity.type = primitives.type
    entity.expiresAt = primitives.expiresAt
    entity.usedAt = primitives.usedAt
    entity.createdAt = primitives.createdAt
    return entity
  }
}
