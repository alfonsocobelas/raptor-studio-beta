import { RegisterMuestraInput } from '../../application/dtos/register-muestra-input.dto'

// UUIDv7 deterministas (reproducibles entre ejecuciones); la idempotencia la dan
// los checks de unicidad del Register use case.
const DERIVED: RegisterMuestraInput[] = [
  {
    id: '019eb800-e2aa-7000-8000-000000000001',
    codigo: 'M-2026-0412',
    estado: 'recibida',
    tecnico: 'Nuria Bragado',
    recogida: '2026-07-06',
    limiteInforme: '2026-07-13',
    importe: 148.5,
    puntoId: '019eb800-1c87-7000-8000-000000000001',
    puntoName: 'Depósito municipal alto'
  },
  {
    id: '019eb800-e2aa-7000-8000-000000000002',
    codigo: 'M-2026-0418',
    estado: 'en_analisis',
    tecnico: 'Álvaro Sanz',
    recogida: '2026-07-09',
    limiteInforme: '2026-07-16',
    importe: 312,
    puntoId: '019eb800-1c87-7000-8000-000000000002',
    puntoName: 'Toma del canal km 12'
  },
  {
    id: '019eb800-e2aa-7000-8000-000000000003',
    codigo: 'M-2026-0425',
    estado: 'fuera_de_rango',
    tecnico: 'Lucía Herrero',
    recogida: '2026-07-14',
    limiteInforme: '2026-07-21',
    importe: 96.75,
    puntoId: '019eb800-1c87-7000-8000-000000000003',
    puntoName: 'Salida de planta de lavado'
  },
  {
    id: '019eb800-e2aa-7000-8000-000000000004',
    codigo: 'M-2026-0431',
    estado: 'validada',
    tecnico: 'Diego Calleja',
    recogida: '2026-07-17',
    limiteInforme: '2026-07-24',
    importe: 540.2,
    puntoId: '019eb800-1c87-7000-8000-000000000004',
    puntoName: 'Grifo red centro urbano'
  },
  {
    id: '019eb800-e2aa-7000-8000-000000000005',
    codigo: 'M-2026-0437',
    estado: 'informada',
    tecnico: 'Nuria Bragado',
    recogida: '2026-07-21',
    limiteInforme: '2026-07-28',
    importe: 218.9,
    puntoId: '019eb800-1c87-7000-8000-000000000005',
    puntoName: 'Efluente de depuradora'
  },
  {
    id: '019eb800-e2aa-7000-8000-000000000006',
    codigo: 'M-2026-0444',
    estado: 'facturada',
    tecnico: 'Álvaro Sanz',
    recogida: '2026-07-24',
    limiteInforme: '2026-07-31',
    importe: 1105.4,
    puntoId: '019eb800-1c87-7000-8000-000000000006',
    puntoName: 'Pozo de riego n.º 3'
  },
  {
    id: '019eb800-e2aa-7000-8000-000000000007',
    codigo: 'M-2026-0450',
    estado: 'recibida',
    tecnico: 'Lucía Herrero',
    recogida: '2026-07-28',
    limiteInforme: '2026-08-04',
    importe: 74.6,
    puntoId: '019eb800-1c87-7000-8000-000000000007',
    puntoName: 'Entrada de proceso embotellado'
  },
  {
    id: '019eb800-e2aa-7000-8000-000000000008',
    codigo: 'M-2026-0456',
    estado: 'en_analisis',
    tecnico: 'Diego Calleja',
    recogida: '2026-07-31',
    limiteInforme: '2026-08-07',
    importe: 389.15,
    puntoId: '019eb800-1c87-7000-8000-000000000008',
    puntoName: 'Depósito de cabecera'
  },
  {
    id: '019eb800-e2aa-7000-8000-000000000009',
    codigo: 'M-2026-0463',
    estado: 'fuera_de_rango',
    tecnico: 'Nuria Bragado',
    recogida: '2026-08-04',
    limiteInforme: '2026-08-11',
    importe: 262.3,
    puntoId: '019eb800-1c87-7000-8000-000000000009',
    puntoName: 'Balsa de decantación'
  },
  {
    id: '019eb800-e2aa-7000-8000-000000000010',
    codigo: 'M-2026-0470',
    estado: 'validada',
    tecnico: 'Álvaro Sanz',
    recogida: '2026-08-11',
    limiteInforme: '2026-08-18',
    importe: 830,
    puntoId: '019eb800-1c87-7000-8000-000000000010',
    puntoName: 'Acequia de La Overuela'
  }
]

// @ai:begin seed-data — filas realistas del cliente (mismo shape RegisterMuestraInput)
const CUSTOM: RegisterMuestraInput[] = []
// @ai:end

export const SEED_MUESTRAS: RegisterMuestraInput[] = [...DERIVED, ...CUSTOM]
