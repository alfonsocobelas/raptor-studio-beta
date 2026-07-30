import { Injectable } from '@nestjs/common'
import { Nullable } from '../../../../../../shared/domain/types'
import { Criteria } from '../../../../../../shared/domain/query/criteria'
import { LicenseId } from '../../../../../../shared/domain/value-objects/licenses/license-id.vo'
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

  async save(license: License): Promise<void> {
    await this.repository().save(LicenseMapper.toPersistence(license))
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
}
