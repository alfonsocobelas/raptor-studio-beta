import { License } from '../../../domain/license'
import { LicenseDoc } from './license.schema'

export class LicenseMapper {
  static toDomain(doc: LicenseDoc): License {
    return License.fromPrimitives({
      id: doc.id,
      contractId: doc.contractId,
      customerId: doc.customerId,
      customerName: doc.customerName,
      contractNumber: doc.contractNumber,
      contractEndDate: doc.contractEndDate,
      metricId: doc.metricId,
      metricName: doc.metricName,
      subSolutionAreaName: doc.subSolutionAreaName,
      metric: doc.metric,
      licensedUnits: doc.licensedUnits,
      pricePerUnit: doc.pricePerUnit,
      status: doc.status,
      source: doc.source,
      materialId: doc.materialId,
      lifecycleStatus: doc.lifecycleStatus,
      archivedAt: doc.archivedAt?.toISOString() ?? null,
      lastSeenInSyncAt: doc.lastSeenInSyncAt?.toISOString() ?? null,
      currentUnits: doc.currentUnits,
      consumptionPct: doc.consumptionPct,
      excessUnits: doc.excessUnits,
      annualValue: doc.annualValue,
      version: doc.version
    })
  }

  // El documento se reemplaza entero en cada save: los hijos embebidos viajan dentro,
  // así que no hay dos escrituras que coordinar (esa es la ventaja del agregado embebido)
  static toPersistence(domain: License): LicenseDoc {
    const primitives = domain.toPrimitives()

    return {
      id: primitives.id,
      contractId: primitives.contractId,
      customerId: primitives.customerId,
      customerName: primitives.customerName,
      contractNumber: primitives.contractNumber,
      contractEndDate: primitives.contractEndDate,
      metricId: primitives.metricId,
      metricName: primitives.metricName,
      subSolutionAreaName: primitives.subSolutionAreaName,
      metric: primitives.metric,
      licensedUnits: primitives.licensedUnits,
      pricePerUnit: primitives.pricePerUnit,
      status: primitives.status,
      source: primitives.source ?? 'MANUAL',
      materialId: primitives.materialId ?? '',
      lifecycleStatus: primitives.lifecycleStatus ?? 'active',
      archivedAt: primitives.archivedAt ? new Date(primitives.archivedAt) : null,
      lastSeenInSyncAt: primitives.lastSeenInSyncAt ? new Date(primitives.lastSeenInSyncAt) : null,
      currentUnits: primitives.currentUnits,
      consumptionPct: primitives.consumptionPct,
      excessUnits: primitives.excessUnits,
      annualValue: primitives.annualValue,
      version: primitives.version
    }
  }

  // @ai:begin mapper-extra — transformaciones a medida (denormalizaciones, derivados)
  // @ai:end
}
