import { SupplierDto } from '@app/shared/domain'
import { OffsetPaginatedOutput } from '../supplier.service'

// Datos de prueba derivados del resource-schema (generados): los specs del servicio y del
// componente los consumen; los valores concretos no importan, la forma sí.
export const MOCK_SUPPLIERS: SupplierDto[] = [
  {
    id: '019eb713-19bb-7000-8000-000000000001',
    name: 'Name 1',
    taxId: 'TaxId 1',
    email: 'Email 1',
    phone: 'Phone 1',
    city: 'City 1',
    leadTimeDays: 100
  },
  {
    id: '019eb713-19bb-7000-8000-000000000002',
    name: 'Name 2',
    taxId: 'TaxId 2',
    email: 'Email 2',
    phone: 'Phone 2',
    city: 'City 2',
    leadTimeDays: 101
  }
]

export const MOCK_SUPPLIERS_PAGINATED: OffsetPaginatedOutput<SupplierDto> = {
  total: 2,
  page: 1,
  pageSize: 10,
  totalPages: 1,
  items: MOCK_SUPPLIERS
}
