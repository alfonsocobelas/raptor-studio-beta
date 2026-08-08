import { PropiedadDto } from '@app/shared/domain'
import { OffsetPaginatedOutput } from '../propiedad.service'

// Datos de prueba derivados del resource-schema (generados): los specs del servicio y del
// componente los consumen; los valores concretos no importan, la forma sí.
export const MOCK_PROPIEDADS: PropiedadDto[] = [
  {
    id: '019eb713-19bb-7000-8000-000000000001',
    titulo: 'Titulo 1',
    zona: 'Zona 1',
    estado: 'disponible',
    metrosCuadrados: 100,
    habitaciones: 100,
    precio: 100,
    fechaAlta: '2026-01-15',
    exclusiva: false,
    agenteId: '019eb713-19bb-7000-8000-000000000002',
    agenteName: 'AgenteName 1'
  },
  {
    id: '019eb713-19bb-7000-8000-000000000002',
    titulo: 'Titulo 2',
    zona: 'Zona 2',
    estado: 'reservada',
    metrosCuadrados: 101,
    habitaciones: 101,
    precio: 101,
    fechaAlta: '2026-02-15',
    exclusiva: true,
    agenteId: '019eb713-19bb-7000-8000-000000000002',
    agenteName: 'AgenteName 2'
  }
]

export const MOCK_PROPIEDADS_PAGINATED: OffsetPaginatedOutput<PropiedadDto> = {
  total: 2,
  page: 1,
  pageSize: 10,
  totalPages: 1,
  items: MOCK_PROPIEDADS
}
