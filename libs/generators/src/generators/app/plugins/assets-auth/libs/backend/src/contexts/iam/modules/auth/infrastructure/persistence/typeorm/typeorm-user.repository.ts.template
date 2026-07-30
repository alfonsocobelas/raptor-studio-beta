import { Injectable } from '@nestjs/common'
import { EntityTarget } from 'typeorm'
import { Nullable } from '../../../../../../shared/domain/types'
import { Criteria } from '../../../../../../shared/domain/query/criteria'
import { TypeOrmCriteriaConverter } from '../../../../../../shared/infrastructure/persistence/typeorm/typeorm-criteria-converter'
import { TypeOrmRepository } from '../../../../../../shared/infrastructure/persistence/typeorm/typeorm.repository'
import { TypeOrmTransactionManager } from '../../../../../../shared/infrastructure/persistence/typeorm/typeorm-transaction-manager'
import { UserId } from '../../../../../../shared/domain/value-objects/iam/user-id.vo'
import { User } from '../../../domain/user'
import { UserRepository } from '../../../domain/user-repository'
import { Email } from '../../../domain/value-objects/email.vo'
import { UserMapper } from './user.mapper'
import { TypeOrmUserEntity } from './typeorm-user.entity'

@Injectable()
export class TypeOrmUserRepository extends TypeOrmRepository<TypeOrmUserEntity> implements UserRepository {
  constructor(transactionManager: TypeOrmTransactionManager, criteriaConverter: TypeOrmCriteriaConverter) {
    super(transactionManager, criteriaConverter)
  }

  protected entityTarget(): EntityTarget<TypeOrmUserEntity> {
    return TypeOrmUserEntity
  }

  async get(id: UserId): Promise<Nullable<User>> {
    const entity = await this.repository().findOneBy({ id: id.value })
    return entity ? UserMapper.toDomain(entity) : null
  }

  async findByEmail(email: Email): Promise<Nullable<User>> {
    const entity = await this.repository().findOneBy({ email: email.value })
    return entity ? UserMapper.toDomain(entity) : null
  }

  async register(user: User): Promise<void> {
    await this.repository().save(UserMapper.toPersistence(user))
  }

  async save(user: User): Promise<void> {
    await this.repository().save(UserMapper.toPersistence(user))
  }

  async matching(criteria: Criteria): Promise<User[]> {
    const entities = await this.searchByCriteria(criteria)
    return entities.map(UserMapper.toDomain)
  }

  async count(criteria: Criteria): Promise<number> {
    return this.countByCriteria(criteria)
  }

  async countActiveAdmins(): Promise<number> {
    return this.repository().countBy({ role: 'admin', status: 'active' })
  }
}
