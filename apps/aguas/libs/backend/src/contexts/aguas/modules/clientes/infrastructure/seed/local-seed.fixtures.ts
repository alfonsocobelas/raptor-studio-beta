import { RegisterClienteInput } from '../../application/dtos/register-cliente-input.dto'

// UUIDv7 deterministas (reproducibles entre ejecuciones); la idempotencia la dan
// los checks de unicidad del Register use case.
const DERIVED: RegisterClienteInput[] = [
  {
    id: '019eb800-8ec3-7000-8000-000000000001',
    nombre: 'Ayuntamiento de Tudela de Duero',
    tipo: 'ayuntamiento',
    telefono: '983 52 10 04',
    localidad: 'Tudela de Duero'
  },
  {
    id: '019eb800-8ec3-7000-8000-000000000002',
    nombre: 'Comunidad de Regantes del Canal del Duero',
    tipo: 'regantes',
    telefono: '983 37 88 21',
    localidad: 'Valladolid'
  },
  {
    id: '019eb800-8ec3-7000-8000-000000000003',
    nombre: 'Lácteas Pisuerga SL',
    tipo: 'alimentacion',
    telefono: '983 44 09 15',
    localidad: 'Cabezón de Pisuerga'
  },
  {
    id: '019eb800-8ec3-7000-8000-000000000004',
    nombre: 'Ayuntamiento de Medina del Campo',
    tipo: 'ayuntamiento',
    telefono: '983 81 12 60',
    localidad: 'Medina del Campo'
  },
  {
    id: '019eb800-8ec3-7000-8000-000000000005',
    nombre: 'Cárnicas Torozos SA',
    tipo: 'regantes',
    telefono: '983 29 74 33',
    localidad: 'Villanubla'
  },
  {
    id: '019eb800-8ec3-7000-8000-000000000006',
    nombre: 'Comunidad de Regantes de La Nava',
    tipo: 'alimentacion',
    telefono: '979 84 21 07',
    localidad: 'Becerril de Campos'
  },
  {
    id: '019eb800-8ec3-7000-8000-000000000007',
    nombre: 'Bodegas Valdecuevas SL',
    tipo: 'ayuntamiento',
    telefono: '983 60 55 18',
    localidad: 'Serrada'
  },
  {
    id: '019eb800-8ec3-7000-8000-000000000008',
    nombre: 'Ayuntamiento de Íscar',
    tipo: 'regantes',
    telefono: '983 61 30 42',
    localidad: 'Íscar'
  },
  {
    id: '019eb800-8ec3-7000-8000-000000000009',
    nombre: 'Conservas del Cerrato SL',
    tipo: 'alimentacion',
    telefono: '979 78 66 90',
    localidad: 'Baltanás'
  },
  {
    id: '019eb800-8ec3-7000-8000-000000000010',
    nombre: 'Comunidad de Regantes del Bajo Duero',
    tipo: 'ayuntamiento',
    telefono: '983 55 47 26',
    localidad: 'Zamora'
  }
]

// @ai:begin seed-data — filas realistas del cliente (mismo shape RegisterClienteInput)
const CUSTOM: RegisterClienteInput[] = []
// @ai:end

export const SEED_CLIENTES: RegisterClienteInput[] = [...DERIVED, ...CUSTOM]
