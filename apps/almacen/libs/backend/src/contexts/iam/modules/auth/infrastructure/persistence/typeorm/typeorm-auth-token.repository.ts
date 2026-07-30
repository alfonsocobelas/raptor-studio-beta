import { Injectable } from '@nestjs/common'
import { DataSource, IsNull, Repository } from 'typeorm'
import { Nullable } from '../../../../../../shared/domain/types'
import { UserId } from '../../../../../../shared/domain/value-objects/iam/user-id.vo'
import { AuthToken } from '../../../domain/auth-token'
import { AuthTokenRepository } from '../../../domain/auth-token-repository'
import { AuthTokenHash } from '../../../domain/value-objects/auth-token-hash.vo'
import { AuthTokenType } from '../../../domain/value-objects/auth-token-type.vo'
import { AuthTokenMapper } from './auth-token.mapper'
import { TypeOrmAuthTokenEntity } from './typeorm-auth-token.entity'

@Injectable()
export class TypeOrmAuthTokenRepository extends AuthTokenRepository {
  constructor(private readonly dataSource: DataSource) {
    super()
  }

  private repo(): Repository<TypeOrmAuthTokenEntity> {
    return this.dataSource.getRepository(TypeOrmAuthTokenEntity)
  }

  async findByTokenHash(tokenHash: AuthTokenHash): Promise<Nullable<AuthToken>> {
    const entity = await this.repo().findOneBy({ tokenHash: tokenHash.value })
    return entity ? AuthTokenMapper.toDomain(entity) : null
  }

  async register(token: AuthToken): Promise<void> {
    await this.repo().save(AuthTokenMapper.toPersistence(token))
  }

  async save(token: AuthToken): Promise<void> {
    await this.repo().save(AuthTokenMapper.toPersistence(token))
  }

  async supersedeUnused(userId: UserId, type: AuthTokenType): Promise<void> {
    await this.repo().update({ userId: userId.value, type: type.value, usedAt: IsNull() }, { usedAt: new Date() })
  }
}
