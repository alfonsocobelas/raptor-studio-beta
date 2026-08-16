import { RegisterPuntoInput } from '../../application/dtos/register-punto-input.dto'

// UUIDv7 deterministas (reproducibles entre ejecuciones); la idempotencia la dan
// los checks de unicidad del Register use case.
const DERIVED: RegisterPuntoInput[] = [
  {
    id: '019eb800-1c87-7000-8000-000000000001',
    nombre: 'Depósito municipal alto',
    tipoAgua: 'potable',
    direccion: 'Camino del Cerro s/n, Tudela de Duero',
    coordenadas: '41.5872, -4.5804',
    obligatorio: true,
    clienteId: '019eb800-8ec3-7000-8000-000000000001',
    clienteName: 'Ayuntamiento de Tudela de Duero'
  },
  {
    id: '019eb800-1c87-7000-8000-000000000002',
    nombre: 'Toma del canal km 12',
    tipoAgua: 'riego',
    direccion: 'Canal del Duero, km 12, Valladolid',
    coordenadas: '41.6420, -4.6910',
    obligatorio: false,
    clienteId: '019eb800-8ec3-7000-8000-000000000002',
    clienteName: 'Comunidad de Regantes del Canal del Duero'
  },
  {
    id: '019eb800-1c87-7000-8000-000000000003',
    nombre: 'Salida de planta de lavado',
    tipoAgua: 'residual',
    direccion: 'Pol. Ind. San Cristóbal, nave 44, Valladolid',
    coordenadas: '41.6015, -4.6883',
    obligatorio: true,
    clienteId: '019eb800-8ec3-7000-8000-000000000003',
    clienteName: 'Lácteas Pisuerga SL'
  },
  {
    id: '019eb800-1c87-7000-8000-000000000004',
    nombre: 'Grifo red centro urbano',
    tipoAgua: 'proceso',
    direccion: 'Plaza Mayor 1, Medina del Campo',
    coordenadas: '41.3128, -4.9147',
    obligatorio: true,
    clienteId: '019eb800-8ec3-7000-8000-000000000004',
    clienteName: 'Ayuntamiento de Medina del Campo'
  },
  {
    id: '019eb800-1c87-7000-8000-000000000005',
    nombre: 'Efluente de depuradora',
    tipoAgua: 'potable',
    direccion: 'Ctra. de Adanero km 3, Villanubla',
    coordenadas: '41.7025, -4.8511',
    obligatorio: true,
    clienteId: '019eb800-8ec3-7000-8000-000000000005',
    clienteName: 'Cárnicas Torozos SA'
  },
  {
    id: '019eb800-1c87-7000-8000-000000000006',
    nombre: 'Pozo de riego n.º 3',
    tipoAgua: 'riego',
    direccion: 'Paraje La Nava, parcela 118, Becerril de Campos',
    coordenadas: '42.0338, -4.6402',
    obligatorio: false,
    clienteId: '019eb800-8ec3-7000-8000-000000000006',
    clienteName: 'Comunidad de Regantes de La Nava'
  },
  {
    id: '019eb800-1c87-7000-8000-000000000007',
    nombre: 'Entrada de proceso embotellado',
    tipoAgua: 'residual',
    direccion: 'Ctra. de Rueda 7, Serrada',
    coordenadas: '41.5163, -4.8025',
    obligatorio: true,
    clienteId: '019eb800-8ec3-7000-8000-000000000007',
    clienteName: 'Bodegas Valdecuevas SL'
  },
  {
    id: '019eb800-1c87-7000-8000-000000000008',
    nombre: 'Depósito de cabecera',
    tipoAgua: 'proceso',
    direccion: 'Calle del Depósito 2, Íscar',
    coordenadas: '41.3567, -4.5312',
    obligatorio: true,
    clienteId: '019eb800-8ec3-7000-8000-000000000008',
    clienteName: 'Ayuntamiento de Íscar'
  },
  {
    id: '019eb800-1c87-7000-8000-000000000009',
    nombre: 'Balsa de decantación',
    tipoAgua: 'potable',
    direccion: 'Camino de la Vega s/n, Baltanás',
    coordenadas: '41.9351, -4.2604',
    obligatorio: false,
    clienteId: '019eb800-8ec3-7000-8000-000000000009',
    clienteName: 'Conservas del Cerrato SL'
  },
  {
    id: '019eb800-1c87-7000-8000-000000000010',
    nombre: 'Acequia de La Overuela',
    tipoAgua: 'riego',
    direccion: 'Acequia de La Overuela, Valladolid',
    coordenadas: '41.6874, -4.7539',
    obligatorio: false,
    clienteId: '019eb800-8ec3-7000-8000-000000000010',
    clienteName: 'Comunidad de Regantes del Bajo Duero'
  }
]

// @ai:begin seed-data — filas realistas del cliente (mismo shape RegisterPuntoInput)
const CUSTOM: RegisterPuntoInput[] = []
// @ai:end

export const SEED_PUNTOS: RegisterPuntoInput[] = [...DERIVED, ...CUSTOM]
