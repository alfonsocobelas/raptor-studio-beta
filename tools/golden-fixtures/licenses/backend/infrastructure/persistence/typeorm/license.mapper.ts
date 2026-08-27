import { License } from '../../../domain/license'
import { TypeOrmLicenseEntity } from './typeorm-license.entity'

export class LicenseMapper {
  static toDomain(entity: TypeOrmLicenseEntity): License {
    return License.fromPrimitives({
      id: entity.id,
      contractId: entity.contractId,
      customerId: entity.customerId,
      customerName: entity.customerName,
      contractNumber: entity.contractNumber,
      contractEndDate: entity.contractEndDate,
      metricId: entity.metricId,
      metricName: entity.metricName,
      subSolutionAreaName: entity.subSolutionAreaName,
      metric: entity.metric,
      licensedUnits: entity.licensedUnits,
      pricePerUnit: entity.pricePerUnit,
      status: entity.status,
      source: entity.source,
      materialId: entity.materialId,
      lifecycleStatus: entity.lifecycleStatus,
      archivedAt: entity.archivedAt?.toISOString() ?? null,
      lastSeenInSyncAt: entity.lastSeenInSyncAt?.toISOString() ?? null,
      currentUnits: entity.currentUnits,
      consumptionPct: entity.consumptionPct,
      excessUnits: entity.excessUnits,
      annualValue: entity.annualValue
    })
  }

  static toPersistence(domain: License): TypeOrmLicenseEntity {
    const primitives = domain.toPrimitives()
    const entity = new TypeOrmLicenseEntity()
    entity.id = primitives.id
    entity.contractId = primitives.contractId
    entity.customerId = primitives.customerId
    entity.customerName = primitives.customerName
    entity.contractNumber = primitives.contractNumber
    entity.contractEndDate = primitives.contractEndDate
    entity.metricId = primitives.metricId
    entity.metricName = primitives.metricName
    entity.subSolutionAreaName = primitives.subSolutionAreaName
    entity.metric = primitives.metric
    entity.licensedUnits = primitives.licensedUnits
    entity.pricePerUnit = primitives.pricePerUnit
    entity.status = primitives.status
    entity.source = primitives.source ?? 'MANUAL'
    entity.materialId = primitives.materialId ?? ''
    entity.lifecycleStatus = primitives.lifecycleStatus ?? 'active'
    entity.archivedAt = primitives.archivedAt ? new Date(primitives.archivedAt) : null
    entity.lastSeenInSyncAt = primitives.lastSeenInSyncAt ? new Date(primitives.lastSeenInSyncAt) : null
    entity.currentUnits = primitives.currentUnits
    entity.consumptionPct = primitives.consumptionPct
    entity.excessUnits = primitives.excessUnits
    entity.annualValue = primitives.annualValue

    return entity
  }

  // @ai:begin mapper-extra — transformaciones a medida (denormalizaciones, derivados)
  // @ai:end
}
