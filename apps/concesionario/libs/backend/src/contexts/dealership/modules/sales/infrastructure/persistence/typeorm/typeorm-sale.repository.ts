import { Injectable } from '@nestjs/common'
import { Nullable } from '../../../../../../shared/domain/types'
import { Criteria } from '../../../../../../shared/domain/query/criteria'
import { SaleId } from '../../../../../../shared/domain/value-objects/sales/sale-id.vo'
import { TypeOrmCriteriaConverter } from '../../../../../../shared/infrastructure/persistence/typeorm/typeorm-criteria-converter'
import { TypeOrmRepository } from '../../../../../../shared/infrastructure/persistence/typeorm/typeorm.repository'
import { TypeOrmTransactionManager } from '../../../../../../shared/infrastructure/persistence/typeorm/typeorm-transaction-manager'
import { Sale } from '../../../domain/sale'
import { SaleRepository } from '../../../domain/sale-repository'
import { SaleReference } from '../../../domain/value-objects/sale-reference.vo'
import { SaleMapper } from './sale.mapper'
import { TypeOrmSaleEntity } from './typeorm-sale.entity'

@Injectable()
export class TypeOrmSaleRepository extends TypeOrmRepository<TypeOrmSaleEntity> implements SaleRepository {
  constructor(transactionManager: TypeOrmTransactionManager, criteriaConverter: TypeOrmCriteriaConverter) {
    super(transactionManager, criteriaConverter)
  }

  protected entityTarget() {
    return TypeOrmSaleEntity
  }

  async register(sale: Sale): Promise<void> {
    await this.repository().save(SaleMapper.toPersistence(sale))
  }

  async save(sale: Sale): Promise<void> {
    await this.repository().save(SaleMapper.toPersistence(sale))
  }

  async remove(saleId: SaleId): Promise<void> {
    await this.repository().delete({ id: saleId.value })
  }

  async get(saleId: SaleId): Promise<Nullable<Sale>> {
    const entity = await this.repository().findOneBy({ id: saleId.value })
    return entity ? SaleMapper.toDomain(entity) : null
  }

  async matching(criteria: Criteria): Promise<Sale[]> {
    const entities = await this.searchByCriteria(criteria)
    return entities.map(SaleMapper.toDomain)
  }

  async findByReference(reference: SaleReference): Promise<Nullable<Sale>> {
    const entity = await this.repository().findOneBy({ reference: reference.value })
    return entity ? SaleMapper.toDomain(entity) : null
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
