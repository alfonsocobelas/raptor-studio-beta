import { Injectable } from '@nestjs/common'
import { Nullable } from '../../../../../../shared/domain/types'
import { Criteria } from '../../../../../../shared/domain/query/criteria'
import { SupplierId } from '../../../../../../shared/domain/value-objects/suppliers/supplier-id.vo'
import { TypeOrmCriteriaConverter } from '../../../../../../shared/infrastructure/persistence/typeorm/typeorm-criteria-converter'
import { TypeOrmRepository } from '../../../../../../shared/infrastructure/persistence/typeorm/typeorm.repository'
import { TypeOrmTransactionManager } from '../../../../../../shared/infrastructure/persistence/typeorm/typeorm-transaction-manager'
import { Supplier } from '../../../domain/supplier'
import { SupplierRepository } from '../../../domain/supplier-repository'
import { SupplierTaxId } from '../../../domain/value-objects/supplier-tax-id.vo'
import { SupplierMapper } from './supplier.mapper'
import { TypeOrmSupplierEntity } from './typeorm-supplier.entity'

@Injectable()
export class TypeOrmSupplierRepository extends TypeOrmRepository<TypeOrmSupplierEntity> implements SupplierRepository {
  constructor(transactionManager: TypeOrmTransactionManager, criteriaConverter: TypeOrmCriteriaConverter) {
    super(transactionManager, criteriaConverter)
  }

  protected entityTarget() {
    return TypeOrmSupplierEntity
  }

  async register(supplier: Supplier): Promise<void> {
    await this.repository().save(SupplierMapper.toPersistence(supplier))
  }

  async save(supplier: Supplier): Promise<void> {
    await this.repository().save(SupplierMapper.toPersistence(supplier))
  }

  async remove(supplierId: SupplierId): Promise<void> {
    await this.repository().delete({ id: supplierId.value })
  }

  async get(supplierId: SupplierId): Promise<Nullable<Supplier>> {
    const entity = await this.repository().findOneBy({ id: supplierId.value })
    return entity ? SupplierMapper.toDomain(entity) : null
  }

  async matching(criteria: Criteria): Promise<Supplier[]> {
    const entities = await this.searchByCriteria(criteria)
    return entities.map(SupplierMapper.toDomain)
  }

  async findByTaxId(taxId: SupplierTaxId): Promise<Nullable<Supplier>> {
    const entity = await this.repository().findOneBy({ taxId: taxId.value })
    return entity ? SupplierMapper.toDomain(entity) : null
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
