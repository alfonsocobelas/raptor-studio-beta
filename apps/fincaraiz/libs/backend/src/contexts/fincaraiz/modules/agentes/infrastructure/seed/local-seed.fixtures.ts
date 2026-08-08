import { RegisterAgenteInput } from '../../application/dtos/register-agente-input.dto'

// UUIDv7 deterministas (reproducibles entre ejecuciones); la idempotencia la dan
// los checks de unicidad del Register use case.
const DERIVED: RegisterAgenteInput[] = [
  {
    id: '019eb800-74b8-7000-8000-000000000001',
    nombre: 'Nuria Salgado Vera',
    email: 'nsalgado@fincaraiz.es',
    telefono: '610 224 891',
    comisionPorcentaje: 2.5,
    activo: true
  },
  {
    id: '019eb800-74b8-7000-8000-000000000002',
    nombre: 'Óscar Delgado Ibarra',
    email: 'odelgado@fincaraiz.es',
    telefono: '638 501 774',
    comisionPorcentaje: 3,
    activo: true
  },
  {
    id: '019eb800-74b8-7000-8000-000000000003',
    nombre: 'Paula Montes Cid',
    email: 'pmontes@fincaraiz.es',
    telefono: '677 930 218',
    comisionPorcentaje: 2.75,
    activo: false
  },
  {
    id: '019eb800-74b8-7000-8000-000000000004',
    nombre: 'Raúl Cifuentes Amo',
    email: 'rcifuentes@fincaraiz.es',
    telefono: '695 146 302',
    comisionPorcentaje: 3.25,
    activo: true
  },
  {
    id: '019eb800-74b8-7000-8000-000000000005',
    nombre: 'Silvia Bermejo Lasa',
    email: 'sbermejo@fincaraiz.es',
    telefono: '624 783 559',
    comisionPorcentaje: 2,
    activo: true
  }
]

// @ai:begin seed-data — filas realistas del cliente (mismo shape RegisterAgenteInput)
const CUSTOM: RegisterAgenteInput[] = []
// @ai:end

export const SEED_AGENTES: RegisterAgenteInput[] = [...DERIVED, ...CUSTOM]
