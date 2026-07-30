import { VehicleDto } from '@app/shared/domain'
import { OffsetPaginatedOutput } from '../vehicle.service'

// Datos de prueba derivados del resource-schema (generados): los specs del servicio y del
// componente los consumen; los valores concretos no importan, la forma sí.
export const MOCK_VEHICLES: VehicleDto[] = [
  {
    id: '019eb713-19bb-7000-8000-000000000001',
    vin: 'Vin 1',
    brand: 'Brand 1',
    model: 'Model 1',
    version: 'Version 1',
    plate: 'Plate 1',
    color: 'Color 1',
    fuel: 'gasoline',
    year: 100,
    mileage: 100,
    price: 100,
    status: 'stock',
    notes: 'Notes 1'
  },
  {
    id: '019eb713-19bb-7000-8000-000000000002',
    vin: 'Vin 2',
    brand: 'Brand 2',
    model: 'Model 2',
    version: 'Version 2',
    plate: 'Plate 2',
    color: 'Color 2',
    fuel: 'diesel',
    year: 101,
    mileage: 101,
    price: 101,
    status: 'reserved',
    notes: 'Notes 2'
  }
]

export const MOCK_VEHICLES_PAGINATED: OffsetPaginatedOutput<VehicleDto> = {
  total: 2,
  page: 1,
  pageSize: 10,
  totalPages: 1,
  items: MOCK_VEHICLES
}
