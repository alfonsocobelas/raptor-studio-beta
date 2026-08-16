import { PuntoDto } from '@app/shared/domain'
import { OffsetPaginatedOutput } from '../punto.service'

// Datos de prueba derivados del resource-schema (generados): los specs del servicio y del
// componente los consumen; los valores concretos no importan, la forma sí.
export const MOCK_PUNTOS: PuntoDto[] = [
  {
    id: '019eb713-19bb-7000-8000-000000000001',
    nombre: 'Nombre 1',
    tipoAgua: 'potable',
    direccion: 'Direccion 1',
    coordenadas: 'Coordenadas 1',
    obligatorio: false,
    clienteId: '019eb713-19bb-7000-8000-000000000002',
    clienteName: 'ClienteName 1'
  },
  {
    id: '019eb713-19bb-7000-8000-000000000002',
    nombre: 'Nombre 2',
    tipoAgua: 'riego',
    direccion: 'Direccion 2',
    coordenadas: 'Coordenadas 2',
    obligatorio: true,
    clienteId: '019eb713-19bb-7000-8000-000000000002',
    clienteName: 'ClienteName 2'
  }
]

export const MOCK_PUNTOS_PAGINATED: OffsetPaginatedOutput<PuntoDto> = {
  total: 2,
  page: 1,
  pageSize: 10,
  totalPages: 1,
  items: MOCK_PUNTOS
}
