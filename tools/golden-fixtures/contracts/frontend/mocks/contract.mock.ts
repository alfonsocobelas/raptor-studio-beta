import {
  ContractDto,
  BillingFrequencyEnum,
  ContractSourceEnum,
  ContractStatusEnum,
  ContractTypeEnum,
  RenewalTypeEnum
} from '@sap-licenses/shared/domain'
import { OffsetPaginatedOutput } from '../contract.service'

// Datos de prueba derivados del resource-schema (generados): los specs del servicio y del
// componente los consumen; los valores concretos no importan, la forma sí.
export const MOCK_CONTRACTS: ContractDto[] = [
  {
    id: '019eb713-19bb-7000-8000-000000000001',
    contractType: ContractTypeEnum.CLOUD,
    contractNumber: 'ContractNumber 1',
    customerId: '019eb713-19bb-7000-8000-000000000002',
    customerName: 'CustomerName 1',
    cmsCaseId: 'CmsCaseId 1',
    businessModel: 'BusinessModel 1',
    subSolutionAreas: ['SubSolutionAreas 1'],
    nbrOfContracts: 100,
    isFavorite: false,
    status: ContractStatusEnum.ACTIVE,
    source: ContractSourceEnum.AVVALE_SOLD,
    startDate: '2026-01-15',
    endDate: '2026-01-15',
    totalValue: 100,
    currency: 'Currency 1',
    billingFrequency: BillingFrequencyEnum.MONTHLY,
    renewalType: RenewalTypeEnum.AUTO,
    notes: 'Notes 1',
    origin: 'Origin 1',
    lifecycleStatus: 'LifecycleStatus 1',
    archivedAt: '2026-01-15T10:00:00.000Z',
    lastSeenInSyncAt: '2026-01-15T10:00:00.000Z',
    supportModel: 'SupportModel 1',
    upcomingMaintenanceEnd: '2026-01-15',
    upcomingMaintenanceFee: 100,
    createdAt: '2026-01-01T09:00:00.000Z',
    updatedAt: '2026-01-01T09:00:00.000Z'
  },
  {
    id: '019eb713-19bb-7000-8000-000000000002',
    contractType: ContractTypeEnum.ONPREM,
    contractNumber: null,
    customerId: '019eb713-19bb-7000-8000-000000000002',
    customerName: 'CustomerName 2',
    cmsCaseId: 'CmsCaseId 2',
    businessModel: 'BusinessModel 2',
    subSolutionAreas: ['SubSolutionAreas 2'],
    nbrOfContracts: 101,
    isFavorite: true,
    status: ContractStatusEnum.EXPIRING,
    source: ContractSourceEnum.CUSTOMER_OWNED,
    startDate: null,
    endDate: null,
    totalValue: 101,
    currency: 'Currency 2',
    billingFrequency: BillingFrequencyEnum.QUARTERLY,
    renewalType: RenewalTypeEnum.MANUAL,
    notes: 'Notes 2',
    origin: 'Origin 2',
    lifecycleStatus: 'LifecycleStatus 2',
    archivedAt: null,
    lastSeenInSyncAt: null,
    supportModel: 'SupportModel 2',
    upcomingMaintenanceEnd: null,
    upcomingMaintenanceFee: null,
    createdAt: '2026-01-02T09:00:00.000Z',
    updatedAt: '2026-01-02T09:00:00.000Z'
  }
]

export const MOCK_CONTRACTS_PAGINATED: OffsetPaginatedOutput<ContractDto> = {
  total: 2,
  page: 1,
  pageSize: 10,
  totalPages: 1,
  items: MOCK_CONTRACTS
}
