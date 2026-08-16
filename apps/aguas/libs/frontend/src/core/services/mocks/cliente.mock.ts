import { ClienteDto } from '@app/shared/domain'
import { OffsetPaginatedOutput } from '../cliente.service'

// Datos de prueba derivados del resource-schema (generados): los specs del servicio y del
// componente los consumen; los valores concretos no importan, la forma sí.
export const MOCK_CLIENTES: ClienteDto[] = [
  {
    id: '019eb713-19bb-7000-8000-000000000001',
    nombre: 'Nombre 1',
    tipo: 'ayuntamiento',
    telefono: 'Telefono 1',
    localidad: 'Localidad 1'
  },
  {
    id: '019eb713-19bb-7000-8000-000000000002',
    nombre: 'Nombre 2',
    tipo: 'regantes',
    telefono: 'Telefono 2',
    localidad: 'Localidad 2'
  }
]

export const MOCK_CLIENTES_PAGINATED: OffsetPaginatedOutput<ClienteDto> = {
  total: 2,
  page: 1,
  pageSize: 10,
  totalPages: 1,
  items: MOCK_CLIENTES
}
