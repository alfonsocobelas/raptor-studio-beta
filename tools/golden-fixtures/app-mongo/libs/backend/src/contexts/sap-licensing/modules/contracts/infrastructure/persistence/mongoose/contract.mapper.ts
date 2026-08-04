import { Contract } from '../../../domain/contract'
import { ContractDoc } from './contract.schema'

export class ContractMapper {
  static toDomain(doc: ContractDoc): Contract {
    return Contract.fromPrimitives({
      id: doc.id,
      contractType: doc.contractType,
      contractNumber: doc.contractNumber,
      customerId: doc.customerId,
      customerName: doc.customerName,
      cmsCaseId: doc.cmsCaseId,
      businessModel: doc.businessModel,
      subSolutionAreas: doc.subSolutionAreas,
      nbrOfContracts: doc.nbrOfContracts,
      isFavorite: doc.isFavorite,
      status: doc.status,
      source: doc.source,
      startDate: doc.startDate,
      endDate: doc.endDate,
      totalValue: doc.totalValue,
      currency: doc.currency,
      billingFrequency: doc.billingFrequency,
      renewalType: doc.renewalType,
      notes: doc.notes,
      origin: doc.origin,
      lifecycleStatus: doc.lifecycleStatus,
      archivedAt: doc.archivedAt?.toISOString() ?? null,
      lastSeenInSyncAt: doc.lastSeenInSyncAt?.toISOString() ?? null,
      supportModel: doc.supportModel,
      upcomingMaintenanceEnd: doc.upcomingMaintenanceEnd,
      upcomingMaintenanceFee: doc.upcomingMaintenanceFee
    })
  }

  // El documento se reemplaza entero en cada save: los hijos embebidos viajan dentro,
  // así que no hay dos escrituras que coordinar (esa es la ventaja del agregado embebido)
  static toPersistence(domain: Contract): ContractDoc {
    const primitives = domain.toPrimitives()

    return {
      id: primitives.id,
      contractType: primitives.contractType,
      contractNumber: primitives.contractNumber,
      customerId: primitives.customerId,
      customerName: primitives.customerName,
      cmsCaseId: primitives.cmsCaseId,
      businessModel: primitives.businessModel,
      subSolutionAreas: primitives.subSolutionAreas,
      nbrOfContracts: primitives.nbrOfContracts,
      isFavorite: primitives.isFavorite,
      status: primitives.status,
      source: primitives.source,
      startDate: primitives.startDate,
      endDate: primitives.endDate,
      totalValue: primitives.totalValue,
      currency: primitives.currency,
      billingFrequency: primitives.billingFrequency,
      renewalType: primitives.renewalType,
      notes: primitives.notes,
      origin: primitives.origin ?? 'MANUAL',
      lifecycleStatus: primitives.lifecycleStatus ?? 'active',
      archivedAt: primitives.archivedAt ? new Date(primitives.archivedAt) : null,
      lastSeenInSyncAt: primitives.lastSeenInSyncAt ? new Date(primitives.lastSeenInSyncAt) : null,
      supportModel: primitives.supportModel ?? '',
      upcomingMaintenanceEnd: primitives.upcomingMaintenanceEnd ?? null,
      upcomingMaintenanceFee: primitives.upcomingMaintenanceFee ?? null
    }
  }

  // @ai:begin mapper-extra — transformaciones a medida (denormalizaciones, derivados)
  // @ai:end
}
