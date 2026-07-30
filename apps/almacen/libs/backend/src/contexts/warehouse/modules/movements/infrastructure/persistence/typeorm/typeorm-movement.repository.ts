import { Injectable } from '@nestjs/common'
import { Nullable } from '../../../../../../shared/domain/types'
import { Criteria } from '../../../../../../shared/domain/query/criteria'
import { MovementId } from '../../../../../../shared/domain/value-objects/movements/movement-id.vo'
import { TypeOrmCriteriaConverter } from '../../../../../../shared/infrastructure/persistence/typeorm/typeorm-criteria-converter'
import { TypeOrmRepository } from '../../../../../../shared/infrastructure/persistence/typeorm/typeorm.repository'
import { TypeOrmTransactionManager } from '../../../../../../shared/infrastructure/persistence/typeorm/typeorm-transaction-manager'
import { Movement } from '../../../domain/movement'
import { MovementRepository } from '../../../domain/movement-repository'
import { MovementReference } from '../../../domain/value-objects/movement-reference.vo'
import { MovementMapper } from './movement.mapper'
import { TypeOrmMovementEntity } from './typeorm-movement.entity'

@Injectable()
export class TypeOrmMovementRepository extends TypeOrmRepository<TypeOrmMovementEntity> implements MovementRepository {
  constructor(transactionManager: TypeOrmTransactionManager, criteriaConverter: TypeOrmCriteriaConverter) {
    super(transactionManager, criteriaConverter)
  }

  protected entityTarget() {
    return TypeOrmMovementEntity
  }

  async register(movement: Movement): Promise<void> {
    await this.repository().save(MovementMapper.toPersistence(movement))
  }

  async save(movement: Movement): Promise<void> {
    await this.repository().save(MovementMapper.toPersistence(movement))
  }

  async remove(movementId: MovementId): Promise<void> {
    await this.repository().delete({ id: movementId.value })
  }

  async get(movementId: MovementId): Promise<Nullable<Movement>> {
    const entity = await this.repository().findOneBy({ id: movementId.value })
    return entity ? MovementMapper.toDomain(entity) : null
  }

  async matching(criteria: Criteria): Promise<Movement[]> {
    const entities = await this.searchByCriteria(criteria)
    return entities.map(MovementMapper.toDomain)
  }

  async findByReference(reference: MovementReference): Promise<Nullable<Movement>> {
    const entity = await this.repository().findOneBy({ reference: reference.value })
    return entity ? MovementMapper.toDomain(entity) : null
  }

  async exists(criteria: Criteria): Promise<boolean> {
    return this.existsByCriteria(criteria)
  }

  async count(criteria: Criteria): Promise<number> {
    return this.countByCriteria(criteria)
  }

  // @ai:begin repository-extra — implementación de los finders del port-extra
  // @ai:end
}
