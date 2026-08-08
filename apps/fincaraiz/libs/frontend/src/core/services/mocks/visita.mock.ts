import { VisitaDto } from '@app/shared/domain'
import { OffsetPaginatedOutput } from '../visita.service'

// Datos de prueba derivados del resource-schema (generados): los specs del servicio y del
// componente los consumen; los valores concretos no importan, la forma sí.
export const MOCK_VISITAS: VisitaDto[] = [
  {
    id: '019eb713-19bb-7000-8000-000000000001',
    referencia: 'Referencia 1',
    fecha: '2026-01-15',
    interesado: 'Interesado 1',
    observaciones: 'Observaciones 1',
    confirmada: false,
    propiedadId: '019eb713-19bb-7000-8000-000000000002',
    propiedadName: 'PropiedadName 1'
  },
  {
    id: '019eb713-19bb-7000-8000-000000000002',
    referencia: 'Referencia 2',
    fecha: '2026-02-15',
    interesado: 'Interesado 2',
    observaciones: 'Observaciones 2',
    confirmada: true,
    propiedadId: '019eb713-19bb-7000-8000-000000000002',
    propiedadName: 'PropiedadName 2'
  }
]

export const MOCK_VISITAS_PAGINATED: OffsetPaginatedOutput<VisitaDto> = {
  total: 2,
  page: 1,
  pageSize: 10,
  totalPages: 1,
  items: MOCK_VISITAS
}
