import { Injectable } from '@nestjs/common'
import { Nullable } from '../../../../../../shared/domain/types'
import { Criteria } from '../../../../../../shared/domain/query/criteria'
import { CustomerId } from '../../../../../../shared/domain/value-objects/customers/customer-id.vo'
import { TypeOrmCriteriaConverter } from '../../../../../../shared/infrastructure/persistence/typeorm/typeorm-criteria-converter'
import { TypeOrmRepository } from '../../../../../../shared/infrastructure/persistence/typeorm/typeorm.repository'
import { TypeOrmTransactionManager } from '../../../../../../shared/infrastructure/persistence/typeorm/typeorm-transaction-manager'
import { Customer } from '../../../domain/customer'
import { CustomerRepository } from '../../../domain/customer-repository'
import { SapId } from '../../../domain/value-objects/sap-id.vo'
import { TaxId } from '../../../domain/value-objects/tax-id.vo'
import { CustomerMapper } from './customer.mapper'
import { TypeOrmCustomerEntity } from './typeorm-customer.entity'

@Injectable()
export class TypeOrmCustomerRepository extends TypeOrmRepository<TypeOrmCustomerEntity> implements CustomerRepository {
  constructor(transactionManager: TypeOrmTransactionManager, criteriaConverter: TypeOrmCriteriaConverter) {
    super(transactionManager, criteriaConverter)
  }

  protected entityTarget() {
    return TypeOrmCustomerEntity
  }

  async register(customer: Customer): Promise<void> {
    await this.repository().save(CustomerMapper.toPersistence(customer))
  }

  async save(customer: Customer): Promise<void> {
    await this.repository().save(CustomerMapper.toPersistence(customer))
  }

  async get(customerId: CustomerId): Promise<Nullable<Customer>> {
    const entity = await this.repository().findOneBy({ id: customerId.value })
    return entity ? CustomerMapper.toDomain(entity) : null
  }

  async matching(criteria: Criteria): Promise<Customer[]> {
    const entities = await this.searchByCriteria(criteria)
    return entities.map(CustomerMapper.toDomain)
  }

  async findBySapId(sapId: SapId): Promise<Nullable<Customer>> {
    const entity = await this.repository().findOneBy({ sapId: sapId.value })
    return entity ? CustomerMapper.toDomain(entity) : null
  }

  async findByTaxId(taxId: TaxId): Promise<Nullable<Customer>> {
    const entity = await this.repository().findOneBy({ taxId: taxId.value })
    return entity ? CustomerMapper.toDomain(entity) : null
  }

  async exists(criteria: Criteria): Promise<boolean> {
    return this.existsByCriteria(criteria)
  }

  async count(criteria: Criteria): Promise<number> {
    return this.countByCriteria(criteria)
  }
}
