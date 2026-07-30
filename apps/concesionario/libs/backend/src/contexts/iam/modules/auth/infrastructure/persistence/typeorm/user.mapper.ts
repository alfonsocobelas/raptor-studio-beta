import { UserPrimitiveProps } from '../../../domain/auth-types'
import { User } from '../../../domain/user'
import { TypeOrmUserEntity } from './typeorm-user.entity'

export class UserMapper {
  static toDomain(entity: TypeOrmUserEntity): User {
    return User.fromPrimitives({
      id: entity.id,
      email: entity.email,
      name: entity.name,
      passwordHash: entity.passwordHash,
      role: entity.role as UserPrimitiveProps['role'],
      status: entity.status as UserPrimitiveProps['status'],
      failedLoginAttempts: entity.failedLoginAttempts,
      lockedUntil: entity.lockedUntil,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    })
  }

  static toPersistence(domain: User): TypeOrmUserEntity {
    const primitives = domain.toPrimitives()
    const entity = new TypeOrmUserEntity()
    entity.id = primitives.id
    entity.email = primitives.email
    entity.name = primitives.name
    entity.passwordHash = primitives.passwordHash
    entity.role = primitives.role
    entity.status = primitives.status
    entity.failedLoginAttempts = primitives.failedLoginAttempts
    entity.lockedUntil = primitives.lockedUntil
    entity.createdAt = primitives.createdAt
    entity.updatedAt = primitives.updatedAt
    return entity
  }
}
