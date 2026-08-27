import { Injectable } from '@nestjs/common'
import { In, IsNull } from 'typeorm'
import { Nullable } from '../../../../../../shared/domain/types'
import { AggregateGroup, AggregateOp, GroupedSpec } from '../../../../../../shared/domain/query/aggregate'
import { Criteria } from '../../../../../../shared/domain/query/criteria'
import { ContractId } from '../../../../../../shared/domain/value-objects/contracts/contract-id.vo'
import { DeleteOperationId } from '../../../../../../shared/domain/value-objects/delete-operation-id.vo'
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

  async removeDraggedByCustomerId(parentIds: string[], op: DeleteOperationId): Promise<string[]> {
    if (!parentIds.length) return []
    const rows = await this.repository().find({
      select: { id: true },
      where: { customerId: In(parentIds), deletedAt: IsNull() }
    })
    const ids = rows.map(row => row.id)
    if (ids.length) {
      await this.repository().update({ id: In(ids) }, { deletedAt: () => 'CURRENT_TIMESTAMP', deletedOp: op.value })
    }
    return ids
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

  async aggregate(criteria: Criteria, op: AggregateOp, field: string): Promise<number | null> {
    return this.aggregateByCriteria(criteria, op, field)
  }

  async aggregateGrouped(criteria: Criteria, spec: GroupedSpec): Promise<AggregateGroup[]> {
    return this.aggregateGroupedByCriteria(criteria, spec)
  }

  // @ai:begin repository-extra — implementación de los finders del port-extra
  // @ai:end
}
