import { LicenseWithConsumptionDto } from '@app/shared/domain'
import { OffsetPaginatedOutput } from '../license.service'

// Datos de prueba derivados del resource-schema (generados): los specs del servicio y del
// componente los consumen; los valores concretos no importan, la forma sí.
export const MOCK_LICENSES: LicenseWithConsumptionDto[] = [
  {
    id: '019eb713-19bb-7000-8000-000000000001',
    contractId: '019eb713-19bb-7000-8000-000000000002',
    customerId: '019eb713-19bb-7000-8000-000000000002',
    customerName: 'CustomerName 1',
    contractNumber: 'ContractNumber 1',
    contractEndDate: '2026-01-15',
    metricId: 'MetricId 1',
    metricName: 'MetricName 1',
    subSolutionAreaName: 'SubSolutionAreaName 1',
    metric: 'Metric 1',
    licensedUnits: 100,
    pricePerUnit: 100,
    status: 'Status 1',
    source: 'Source 1',
    materialId: 'MaterialId 1',
    lifecycleStatus: 'LifecycleStatus 1',
    archivedAt: '2026-01-15T10:00:00.000Z',
    lastSeenInSyncAt: '2026-01-15T10:00:00.000Z',
    currentUnits: 100,
    consumptionPct: 100,
    excessUnits: 100,
    annualValue: 100
  },
  {
    id: '019eb713-19bb-7000-8000-000000000002',
    contractId: '019eb713-19bb-7000-8000-000000000002',
    customerId: '019eb713-19bb-7000-8000-000000000002',
    customerName: 'CustomerName 2',
    contractNumber: 'ContractNumber 2',
    contractEndDate: null,
    metricId: 'MetricId 2',
    metricName: 'MetricName 2',
    subSolutionAreaName: 'SubSolutionAreaName 2',
    metric: 'Metric 2',
    licensedUnits: 101,
    pricePerUnit: 101,
    status: 'Status 2',
    source: 'Source 2',
    materialId: 'MaterialId 2',
    lifecycleStatus: 'LifecycleStatus 2',
    archivedAt: null,
    lastSeenInSyncAt: null,
    currentUnits: 101,
    consumptionPct: 101,
    excessUnits: 101,
    annualValue: 101
  }
]

export const MOCK_LICENSES_PAGINATED: OffsetPaginatedOutput<LicenseWithConsumptionDto> = {
  total: 2,
  page: 1,
  pageSize: 10,
  totalPages: 1,
  items: MOCK_LICENSES
}
