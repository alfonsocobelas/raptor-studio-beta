import { ParametroDto } from '@app/shared/domain'
import { OffsetPaginatedOutput } from '../parametro.service'

// Datos de prueba derivados del resource-schema (generados): los specs del servicio y del
// componente los consumen; los valores concretos no importan, la forma sí.
export const MOCK_PARAMETROS: ParametroDto[] = [
  {
    id: '019eb713-19bb-7000-8000-000000000001',
    codigo: 'Codigo 1',
    nombre: 'Nombre 1',
    metodo: 'Metodo 1',
    limiteLegal: 100,
    precio: 100
  },
  {
    id: '019eb713-19bb-7000-8000-000000000002',
    codigo: 'Codigo 2',
    nombre: 'Nombre 2',
    metodo: 'Metodo 2',
    limiteLegal: 101,
    precio: 101
  }
]

export const MOCK_PARAMETROS_PAGINATED: OffsetPaginatedOutput<ParametroDto> = {
  total: 2,
  page: 1,
  pageSize: 10,
  totalPages: 1,
  items: MOCK_PARAMETROS
}
