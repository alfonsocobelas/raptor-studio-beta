import { Injectable } from '@nestjs/common'
import { In, IsNull } from 'typeorm'
import { ConcurrencyConflictError } from '../../../../../../shared/domain/errors'
import { Nullable } from '../../../../../../shared/domain/types'
import { AggregateGroup, AggregateOp, GroupedSpec } from '../../../../../../shared/domain/query/aggregate'
import { Criteria } from '../../../../../../shared/domain/query/criteria'
import { LicenseId } from '../../../../../../shared/domain/value-objects/licenses/license-id.vo'
import { DeleteOperationId } from '../../../../../../shared/domain/value-objects/delete-operation-id.vo'
import { TypeOrmCriteriaConverter } from '../../../../../../shared/infrastructure/persistence/typeorm/typeorm-criteria-converter'
import { TypeOrmRepository } from '../../../../../../shared/infrastructure/persistence/typeorm/typeorm.repository'
import { TypeOrmTransactionManager } from '../../../../../../shared/infrastructure/persistence/typeorm/typeorm-transaction-manager'
import { License } from '../../../domain/license'
import { LicenseRepository } from '../../../domain/license-repository'
import { LicenseMapper } from './license.mapper'
import { TypeOrmLicenseEntity } from './typeorm-license.entity'

@Injectable()
export class TypeOrmLicenseRepository extends TypeOrmRepository<TypeOrmLicenseEntity> implements LicenseRepository {
  constructor(transactionManager: TypeOrmTransactionManager, criteriaConverter: TypeOrmCriteriaConverter) {
    super(transactionManager, criteriaConverter)
  }

  protected entityTarget() {
    return TypeOrmLicenseEntity
  }

  async register(license: License): Promise<void> {
    await this.repository().save(LicenseMapper.toPersistence(license))
  }

  // Escritura condicional (spec 78): solo pisa la fila si nadie la movió desde la lectura
  async save(license: License): Promise<void> {
    const entity = LicenseMapper.toPersistence(license)
    const result = await this.repository().update(
      { id: entity.id, version: entity.version },
      { ...entity, version: () => 'version + 1' }
    )

    if (!result.affected) {
      throw new ConcurrencyConflictError('License', entity.id)
    }
  }

  async removeDraggedByContractId(parentIds: string[], op: DeleteOperationId): Promise<string[]> {
    if (!parentIds.length) return []
    const rows = await this.repository().find({
      select: { id: true },
      where: { contractId: In(parentIds), deletedAt: IsNull() }
    })
    const ids = rows.map(row => row.id)
    if (ids.length) {
      await this.repository().update({ id: In(ids) }, { deletedAt: () => 'CURRENT_TIMESTAMP', deletedOp: op.value })
    }
    return ids
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

  async get(licenseId: LicenseId): Promise<Nullable<License>> {
    const entity = await this.repository().findOneBy({ id: licenseId.value })
    return entity ? LicenseMapper.toDomain(entity) : null
  }

  async matching(criteria: Criteria): Promise<License[]> {
    const entities = await this.searchByCriteria(criteria)
    return entities.map(LicenseMapper.toDomain)
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
