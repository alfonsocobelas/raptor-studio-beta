import { Injectable } from '@nestjs/common'
import { Nullable } from '../../../../../../shared/domain/types'
import { Criteria } from '../../../../../../shared/domain/query/criteria'
import { GarmentId } from '../../../../../../shared/domain/value-objects/garments/garment-id.vo'
import { TypeOrmCriteriaConverter } from '../../../../../../shared/infrastructure/persistence/typeorm/typeorm-criteria-converter'
import { TypeOrmRepository } from '../../../../../../shared/infrastructure/persistence/typeorm/typeorm.repository'
import { TypeOrmTransactionManager } from '../../../../../../shared/infrastructure/persistence/typeorm/typeorm-transaction-manager'
import { Garment } from '../../../domain/garment'
import { GarmentRepository } from '../../../domain/garment-repository'
import { Sku } from '../../../domain/value-objects/sku.vo'
import { GarmentMapper } from './garment.mapper'
import { TypeOrmGarmentEntity } from './typeorm-garment.entity'

@Injectable()
export class TypeOrmGarmentRepository extends TypeOrmRepository<TypeOrmGarmentEntity> implements GarmentRepository {
  constructor(transactionManager: TypeOrmTransactionManager, criteriaConverter: TypeOrmCriteriaConverter) {
    super(transactionManager, criteriaConverter)
  }

  protected entityTarget() {
    return TypeOrmGarmentEntity
  }

  async register(garment: Garment): Promise<void> {
    await this.repository().save(GarmentMapper.toPersistence(garment))
  }

  async save(garment: Garment): Promise<void> {
    await this.repository().save(GarmentMapper.toPersistence(garment))
  }

  async remove(garmentId: GarmentId): Promise<void> {
    await this.repository().delete({ id: garmentId.value })
  }

  async get(garmentId: GarmentId): Promise<Nullable<Garment>> {
    const entity = await this.repository().findOneBy({ id: garmentId.value })
    return entity ? GarmentMapper.toDomain(entity) : null
  }

  async matching(criteria: Criteria): Promise<Garment[]> {
    const entities = await this.searchByCriteria(criteria)
    return entities.map(GarmentMapper.toDomain)
  }

  async findBySku(sku: Sku): Promise<Nullable<Garment>> {
    const entity = await this.repository().findOneBy({ sku: sku.value })
    return entity ? GarmentMapper.toDomain(entity) : null
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
