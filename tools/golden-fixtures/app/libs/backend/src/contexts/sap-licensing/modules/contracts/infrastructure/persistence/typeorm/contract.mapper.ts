import { Contract } from '../../../domain/contract'
import { TypeOrmContractEntity } from './typeorm-contract.entity'

export class ContractMapper {
  static toDomain(entity: TypeOrmContractEntity): Contract {
    return Contract.fromPrimitives({
      id: entity.id,
      contractType: entity.contractType,
      contractNumber: entity.contractNumber,
      customerId: entity.customerId,
      customerName: entity.customerName,
      cmsCaseId: entity.cmsCaseId,
      businessModel: entity.businessModel,
      subSolutionAreas: entity.subSolutionAreas,
      nbrOfContracts: entity.nbrOfContracts,
      isFavorite: entity.isFavorite,
      status: entity.status,
      source: entity.source,
      startDate: entity.startDate,
      endDate: entity.endDate,
      totalValue: entity.totalValue,
      currency: entity.currency,
      billingFrequency: entity.billingFrequency,
      renewalType: entity.renewalType,
      notes: entity.notes,
      origin: entity.origin,
      lifecycleStatus: entity.lifecycleStatus,
      archivedAt: entity.archivedAt?.toISOString() ?? null,
      lastSeenInSyncAt: entity.lastSeenInSyncAt?.toISOString() ?? null,
      supportModel: entity.supportModel,
      upcomingMaintenanceEnd: entity.upcomingMaintenanceEnd,
      upcomingMaintenanceFee: entity.upcomingMaintenanceFee,
      version: entity.version
    })
  }

  static toPersistence(domain: Contract): TypeOrmContractEntity {
    const primitives = domain.toPrimitives()
    const entity = new TypeOrmContractEntity()
    entity.id = primitives.id
    entity.contractType = primitives.contractType
    entity.contractNumber = primitives.contractNumber
    entity.customerId = primitives.customerId
    entity.customerName = primitives.customerName
    entity.cmsCaseId = primitives.cmsCaseId
    entity.businessModel = primitives.businessModel
    entity.subSolutionAreas = primitives.subSolutionAreas
    entity.nbrOfContracts = primitives.nbrOfContracts
    entity.isFavorite = primitives.isFavorite
    entity.status = primitives.status
    entity.source = primitives.source
    entity.startDate = primitives.startDate
    entity.endDate = primitives.endDate
    entity.totalValue = primitives.totalValue
    entity.currency = primitives.currency
    entity.billingFrequency = primitives.billingFrequency
    entity.renewalType = primitives.renewalType
    entity.notes = primitives.notes
    entity.origin = primitives.origin ?? 'MANUAL'
    entity.lifecycleStatus = primitives.lifecycleStatus ?? 'active'
    entity.archivedAt = primitives.archivedAt ? new Date(primitives.archivedAt) : null
    entity.lastSeenInSyncAt = primitives.lastSeenInSyncAt ? new Date(primitives.lastSeenInSyncAt) : null
    entity.supportModel = primitives.supportModel ?? ''
    entity.upcomingMaintenanceEnd = primitives.upcomingMaintenanceEnd ?? null
    entity.upcomingMaintenanceFee = primitives.upcomingMaintenanceFee ?? null
    entity.version = primitives.version

    return entity
  }

  // @ai:begin mapper-extra — transformaciones a medida (denormalizaciones, derivados)
  // @ai:end
}
