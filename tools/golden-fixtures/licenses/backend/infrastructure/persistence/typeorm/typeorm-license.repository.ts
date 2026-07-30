import { Injectable } from '@nestjs/common'
import { Nullable } from '../../../../../../shared/domain/types'
import { Criteria } from '../../../../../../shared/domain/query/criteria'
import { TypeOrmCriteriaConverter } from '../../../../../../shared/infrastructure/persistence/typeorm/typeorm-criteria-converter'
import { TypeOrmRepository } from '../../../../../../shared/infrastructure/persistence/typeorm/typeorm.repository'
import { TypeOrmTransactionManager } from '../../../../../../shared/infrastructure/persistence/typeorm/typeorm-transaction-manager'
import { LicenseId } from '../../../../../../shared/domain/value-objects/licenses/license-id.vo'
import { License } from '../../../domain/license'
import { LicenseRepository, LicenseWithConsumptionHistory } from '../../../domain/license-repository'
import { ConsumptionRecord } from '../../../domain/license-types'
import { MAX_CONSUMPTION_PCT } from '../../../domain/consumption-snapshot'
import { LicenseMapper } from './license.mapper'
import { TypeOrmConsumptionRecordEntity } from './typeorm-consumption-record.entity'
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

  async getWithConsumption(licenseId: LicenseId): Promise<Nullable<LicenseWithConsumptionHistory>> {
    const entity = await this.repository().findOneBy({ id: licenseId.value })
    if (!entity) {
      return null
    }
    const consumption = await this.consumptionByLicense(licenseId)
    return { license: LicenseMapper.toDomain(entity), consumption }
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

  async addConsumption(record: ConsumptionRecord): Promise<void> {
    await this.consumptionRepository().save(LicenseMapper.consumptionToPersistence(record))
  }

  // TypeORM save() upserts by primary key: with an existing id it updates the row.
  async updateConsumption(record: ConsumptionRecord): Promise<void> {
    await this.consumptionRepository().save(LicenseMapper.consumptionToPersistence(record))
  }

  // UPDATE atómico que relee el registro más reciente vía subquery escalar correlada (mismo
  // criterio que el backfill de la migración y que consumption-snapshot.ts). Usa el client()
  // transaction-aware, así que se une a la transacción del use case que escribe el consumo.
  async recomputeConsumptionSnapshot(licenseId: LicenseId): Promise<void> {
    await this.client().query(
      `
      WITH latest AS (
        SELECT COALESCE((
          SELECT c.units FROM sap_licensing.consumption_records c
          WHERE c.license_id = $1
          ORDER BY c.period_year DESC, c.period_month DESC
          LIMIT 1
        ), 0) AS units
      )
      UPDATE sap_licensing.licenses l SET
        current_units   = latest.units,
        consumption_pct = CASE WHEN l.licensed_units > 0
                               THEN LEAST(latest.units::numeric / l.licensed_units * 100, ${MAX_CONSUMPTION_PCT})
                               ELSE 0 END,
        excess_units    = GREATEST(0, latest.units - l.licensed_units)
        -- annual_value NO se recalcula (spec 42): es dato autoritativo de SAP, lo fija el sync
      FROM latest
      WHERE l.id = $1
      `,
      [licenseId.value]
    )
  }

  async consumptionForPeriod(
    licenseId: LicenseId,
    periodYear: number,
    periodMonth: number
  ): Promise<Nullable<ConsumptionRecord>> {
    const entity = await this.consumptionRepository().findOne({
      where: { licenseId: licenseId.value, periodYear, periodMonth }
    })
    return entity ? LicenseMapper.consumptionToDomain(entity) : null
  }

  async consumptionByLicense(licenseId: LicenseId): Promise<ConsumptionRecord[]> {
    const entities = await this.consumptionRepository().find({
      where: { licenseId: licenseId.value },
      order: { periodYear: 'DESC', periodMonth: 'DESC' }
    })
    return entities.map(LicenseMapper.consumptionToDomain)
  }

  private consumptionRepository() {
    return this.client().getRepository(TypeOrmConsumptionRecordEntity)
  }
}
