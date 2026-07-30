import { CustomerDto, CustomerClassification } from '@sap-licenses/shared/domain'
import { OffsetPaginatedOutput } from '../customer.service'

// Datos de prueba derivados del resource-schema (generados): los specs del servicio y del
// componente los consumen; los valores concretos no importan, la forma sí.
export const MOCK_CUSTOMERS: CustomerDto[] = [
  {
    id: '019eb713-19bb-7000-8000-000000000001',
    sapId: 'SapId 1',
    name: 'Name 1',
    taxId: 'TaxId 1',
    industry: 'Industry 1',
    address: 'Address 1',
    phone: 'Phone 1',
    notes: 'Notes 1',
    city: 'City 1',
    country: 'Country 1',
    customerType: CustomerClassification.CLOUD,
    status: 'Status 1',
    archivedAt: '2026-01-15T10:00:00.000Z',
    lastSeenInSyncAt: '2026-01-15T10:00:00.000Z'
  },
  {
    id: '019eb713-19bb-7000-8000-000000000002',
    sapId: 'SapId 2',
    name: 'Name 2',
    taxId: 'TaxId 2',
    industry: 'Industry 2',
    address: 'Address 2',
    phone: 'Phone 2',
    notes: 'Notes 2',
    city: 'City 2',
    country: 'Country 2',
    customerType: CustomerClassification.ONPREM,
    status: 'Status 2',
    archivedAt: null,
    lastSeenInSyncAt: null
  }
]

export const MOCK_CUSTOMERS_PAGINATED: OffsetPaginatedOutput<CustomerDto> = {
  total: 2,
  page: 1,
  pageSize: 10,
  totalPages: 1,
  items: MOCK_CUSTOMERS
}
