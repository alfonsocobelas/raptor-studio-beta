import { ClientDto } from '@app/shared/domain'
import { OffsetPaginatedOutput } from '../client.service'

// Datos de prueba derivados del resource-schema (generados): los specs del servicio y del
// componente los consumen; los valores concretos no importan, la forma sí.
export const MOCK_CLIENTS: ClientDto[] = [
  {
    id: '019eb713-19bb-7000-8000-000000000001',
    name: 'Name 1',
    clientType: 'individual',
    taxId: 'TaxId 1',
    email: 'Email 1',
    phone: 'Phone 1',
    city: 'City 1',
    address: 'Address 1',
    notes: 'Notes 1'
  },
  {
    id: '019eb713-19bb-7000-8000-000000000002',
    name: 'Name 2',
    clientType: 'company',
    taxId: 'TaxId 2',
    email: 'Email 2',
    phone: 'Phone 2',
    city: 'City 2',
    address: 'Address 2',
    notes: 'Notes 2'
  }
]

export const MOCK_CLIENTS_PAGINATED: OffsetPaginatedOutput<ClientDto> = {
  total: 2,
  page: 1,
  pageSize: 10,
  totalPages: 1,
  items: MOCK_CLIENTS
}
