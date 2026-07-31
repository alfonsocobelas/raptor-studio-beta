import { Injectable } from '@nestjs/common'
import { DataSource, Repository } from 'typeorm'
import { Nullable } from '../../../../../../shared/domain/types'
import { UserId } from '../../../../../../shared/domain/value-objects/iam/user-id.vo'
import { Session } from '../../../domain/session'
import { SessionRepository } from '../../../domain/session-repository'
import { SessionTokenHash } from '../../../domain/value-objects/session-token-hash.vo'
import { SessionMapper } from './session.mapper'
import { TypeOrmSessionEntity } from './typeorm-session.entity'

@Injectable()
export class TypeOrmSessionRepository extends SessionRepository {
  constructor(private readonly dataSource: DataSource) {
    super()
  }

  private repo(): Repository<TypeOrmSessionEntity> {
    return this.dataSource.getRepository(TypeOrmSessionEntity)
  }

  async findByTokenHash(tokenHash: SessionTokenHash): Promise<Nullable<Session>> {
    const entity = await this.repo().findOneBy({ tokenHash: tokenHash.value })
    return entity ? SessionMapper.toDomain(entity) : null
  }

  async register(session: Session): Promise<void> {
    await this.repo().save(SessionMapper.toPersistence(session))
  }

  async save(session: Session): Promise<void> {
    await this.repo().save(SessionMapper.toPersistence(session))
  }

  async deleteByTokenHash(tokenHash: SessionTokenHash): Promise<void> {
    await this.repo().delete({ tokenHash: tokenHash.value })
  }

  async deleteAllByUserId(userId: UserId): Promise<void> {
    await this.repo().delete({ userId: userId.value })
  }
}
