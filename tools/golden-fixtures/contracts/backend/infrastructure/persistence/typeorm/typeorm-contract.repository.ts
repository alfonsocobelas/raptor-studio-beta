import { Injectable } from '@nestjs/common'
import { Nullable } from '../../../../../../shared/domain/types'
import { Criteria } from '../../../../../../shared/domain/query/criteria'
import { ContractId } from '../../../../../../shared/domain/value-objects/contracts/contract-id.vo'
import { TypeOrmCriteriaConverter } from '../../../../../../shared/infrastructure/persistence/typeorm/typeorm-criteria-converter'
import { TypeOrmRepository } from '../../../../../../shared/infrastructure/persistence/typeorm/typeorm.repository'
import { TypeOrmTransactionManager } from '../../../../../../shared/infrastructure/persistence/typeorm/typeorm-transaction-manager'
import { Contract } from '../../../domain/contract'
import { ContractRepository } from '../../../domain/contract-repository'
import { ContractNumber } from '../../../../../shared/domain/value-objects/contract-number.vo'
import { ContractMapper } from './contract.mapper'
import { TypeOrmContractEntity } from './typeorm-contract.entity'

@Injectable()
export class TypeOrmContractRepository extends TypeOrmRepository<TypeOrmContractEntity> implements ContractRepository {
  constructor(transactionManager: TypeOrmTransactionManager, criteriaConverter: TypeOrmCriteriaConverter) {
    super(transactionManager, criteriaConverter)
  }

  protected entityTarget() {
    return TypeOrmContractEntity
  }

  async register(contract: Contract): Promise<void> {
    await this.repository().save(ContractMapper.toPersistence(contract))
  }

  async save(contract: Contract): Promise<void> {
    await this.repository().save(ContractMapper.toPersistence(contract))
  }

  async get(contractId: ContractId): Promise<Nullable<Contract>> {
    const entity = await this.repository().findOneBy({ id: contractId.value })
    return entity ? ContractMapper.toDomain(entity) : null
  }

  async matching(criteria: Criteria): Promise<Contract[]> {
    const entities = await this.searchByCriteria(criteria)
    return entities.map(ContractMapper.toDomain)
  }

  async findByContractNumber(contractNumber: ContractNumber): Promise<Nullable<Contract>> {
    const entity = await this.repository().findOneBy({ contractNumber: contractNumber.value })
    return entity ? ContractMapper.toDomain(entity) : null
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
