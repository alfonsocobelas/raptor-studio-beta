import { SaleDto } from '@app/shared/domain'
import { OffsetPaginatedOutput } from '../sale.service'

// Datos de prueba derivados del resource-schema (generados): los specs del servicio y del
// componente los consumen; los valores concretos no importan, la forma sí.
export const MOCK_SALES: SaleDto[] = [
  {
    id: '019eb713-19bb-7000-8000-000000000001',
    reference: 'Reference 1',
    saleDate: '2026-01-15',
    vehicleLabel: 'VehicleLabel 1',
    clientLabel: 'ClientLabel 1',
    salesperson: 'Salesperson 1',
    amount: 100,
    discount: 100,
    paymentMethod: 'cash',
    status: 'pending'
  },
  {
    id: '019eb713-19bb-7000-8000-000000000002',
    reference: 'Reference 2',
    saleDate: '2026-02-15',
    vehicleLabel: 'VehicleLabel 2',
    clientLabel: 'ClientLabel 2',
    salesperson: 'Salesperson 2',
    amount: 101,
    discount: 101,
    paymentMethod: 'financing',
    status: 'delivered'
  }
]

export const MOCK_SALES_PAGINATED: OffsetPaginatedOutput<SaleDto> = {
  total: 2,
  page: 1,
  pageSize: 10,
  totalPages: 1,
  items: MOCK_SALES
}
