import { AgenteDto } from '@app/shared/domain'
import { OffsetPaginatedOutput } from '../agente.service'

// Datos de prueba derivados del resource-schema (generados): los specs del servicio y del
// componente los consumen; los valores concretos no importan, la forma sí.
export const MOCK_AGENTES: AgenteDto[] = [
  {
    id: '019eb713-19bb-7000-8000-000000000001',
    nombre: 'Nombre 1',
    email: 'Email 1',
    telefono: 'Telefono 1',
    comisionPorcentaje: 100,
    activo: false
  },
  {
    id: '019eb713-19bb-7000-8000-000000000002',
    nombre: 'Nombre 2',
    email: 'Email 2',
    telefono: 'Telefono 2',
    comisionPorcentaje: 101,
    activo: true
  }
]

export const MOCK_AGENTES_PAGINATED: OffsetPaginatedOutput<AgenteDto> = {
  total: 2,
  page: 1,
  pageSize: 10,
  totalPages: 1,
  items: MOCK_AGENTES
}
