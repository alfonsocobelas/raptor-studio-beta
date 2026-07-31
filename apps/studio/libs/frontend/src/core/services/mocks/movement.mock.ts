import { MovementDto } from '@app/shared/domain'
import { OffsetPaginatedOutput } from '../movement.service'

// Datos de prueba derivados del resource-schema (generados): los specs del servicio y del
// componente los consumen; los valores concretos no importan, la forma sí.
export const MOCK_MOVEMENTS: MovementDto[] = [
  {
    id: '019eb713-19bb-7000-8000-000000000001',
    reference: 'Reference 1',
    movementDate: '2026-01-15',
    movementType: 'in',
    garmentLabel: 'GarmentLabel 1',
    quantity: 100,
    counterparty: 'Counterparty 1',
    reason: 'purchase'
  },
  {
    id: '019eb713-19bb-7000-8000-000000000002',
    reference: 'Reference 2',
    movementDate: '2026-02-15',
    movementType: 'out',
    garmentLabel: 'GarmentLabel 2',
    quantity: 101,
    counterparty: 'Counterparty 2',
    reason: 'sale'
  }
]

export const MOCK_MOVEMENTS_PAGINATED: OffsetPaginatedOutput<MovementDto> = {
  total: 2,
  page: 1,
  pageSize: 10,
  totalPages: 1,
  items: MOCK_MOVEMENTS
}
