import { GarmentDto } from '@app/shared/domain'
import { OffsetPaginatedOutput } from '../garment.service'

// Datos de prueba derivados del resource-schema (generados): los specs del servicio y del
// componente los consumen; los valores concretos no importan, la forma sí.
export const MOCK_GARMENTS: GarmentDto[] = [
  {
    id: '019eb713-19bb-7000-8000-000000000001',
    sku: 'Sku 1',
    name: 'Name 1',
    category: 'tshirt',
    size: 'XS',
    brand: 'Brand 1',
    color: 'Color 1',
    price: 100,
    stock: 100,
    status: 'active'
  },
  {
    id: '019eb713-19bb-7000-8000-000000000002',
    sku: 'Sku 2',
    name: 'Name 2',
    category: 'trousers',
    size: 'S',
    brand: 'Brand 2',
    color: 'Color 2',
    price: 101,
    stock: 101,
    status: 'discontinued'
  }
]

export const MOCK_GARMENTS_PAGINATED: OffsetPaginatedOutput<GarmentDto> = {
  total: 2,
  page: 1,
  pageSize: 10,
  totalPages: 1,
  items: MOCK_GARMENTS
}
