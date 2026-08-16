import { MuestraDto } from '@app/shared/domain'
import { OffsetPaginatedOutput } from '../muestra.service'

// Datos de prueba derivados del resource-schema (generados): los specs del servicio y del
// componente los consumen; los valores concretos no importan, la forma sí.
export const MOCK_MUESTRAS: MuestraDto[] = [
  {
    id: '019eb713-19bb-7000-8000-000000000001',
    codigo: 'Codigo 1',
    estado: 'recibida',
    tecnico: 'Tecnico 1',
    recogida: '2026-01-15',
    limiteInforme: '2026-01-15',
    importe: 100,
    puntoId: '019eb713-19bb-7000-8000-000000000002',
    puntoName: 'PuntoName 1'
  },
  {
    id: '019eb713-19bb-7000-8000-000000000002',
    codigo: 'Codigo 2',
    estado: 'en_analisis',
    tecnico: 'Tecnico 2',
    recogida: '2026-02-15',
    limiteInforme: '2026-02-15',
    importe: 101,
    puntoId: '019eb713-19bb-7000-8000-000000000002',
    puntoName: 'PuntoName 2'
  }
]

export const MOCK_MUESTRAS_PAGINATED: OffsetPaginatedOutput<MuestraDto> = {
  total: 2,
  page: 1,
  pageSize: 10,
  totalPages: 1,
  items: MOCK_MUESTRAS
}
