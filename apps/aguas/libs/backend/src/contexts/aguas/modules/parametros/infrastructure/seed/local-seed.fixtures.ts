import { RegisterParametroInput } from '../../application/dtos/register-parametro-input.dto'

// UUIDv7 deterministas (reproducibles entre ejecuciones); la idempotencia la dan
// los checks de unicidad del Register use case.
const DERIVED: RegisterParametroInput[] = [
  {
    id: '019eb800-38e3-7000-8000-000000000001',
    codigo: 'PA-001',
    nombre: 'Nitratos',
    metodo: 'UNE-EN ISO 10304-1',
    limiteLegal: 50,
    precio: 18.4
  },
  {
    id: '019eb800-38e3-7000-8000-000000000002',
    codigo: 'PA-014',
    nombre: 'Escherichia coli',
    metodo: 'UNE-EN ISO 9308-1',
    limiteLegal: 0,
    precio: 26.5
  },
  {
    id: '019eb800-38e3-7000-8000-000000000003',
    codigo: 'PA-022',
    nombre: 'Cloro libre residual',
    metodo: 'UNE-EN ISO 7393-2',
    limiteLegal: 1,
    precio: 9.8
  },
  {
    id: '019eb800-38e3-7000-8000-000000000004',
    codigo: 'PA-030',
    nombre: 'Turbidez',
    metodo: 'UNE-EN ISO 7027-1',
    limiteLegal: 4,
    precio: 12.3
  },
  {
    id: '019eb800-38e3-7000-8000-000000000005',
    codigo: 'PA-041',
    nombre: 'Conductividad a 20 °C',
    metodo: 'UNE-EN 27888',
    limiteLegal: 2500,
    precio: 8.75
  },
  {
    id: '019eb800-38e3-7000-8000-000000000006',
    codigo: 'PA-055',
    nombre: 'Arsénico',
    metodo: 'UNE-EN ISO 17294-2',
    limiteLegal: 0.01,
    precio: 42
  },
  {
    id: '019eb800-38e3-7000-8000-000000000007',
    codigo: 'PA-063',
    nombre: 'Plomo',
    metodo: 'UNE-EN ISO 17294-2',
    limiteLegal: 0.005,
    precio: 44.6
  },
  {
    id: '019eb800-38e3-7000-8000-000000000008',
    codigo: 'PA-078',
    nombre: 'Amonio',
    metodo: 'UNE-EN ISO 11732',
    limiteLegal: 0.5,
    precio: 15.2
  },
  {
    id: '019eb800-38e3-7000-8000-000000000009',
    codigo: 'PA-084',
    nombre: 'pH',
    metodo: 'UNE-EN ISO 10523',
    limiteLegal: 9.5,
    precio: 6.5
  },
  {
    id: '019eb800-38e3-7000-8000-000000000010',
    codigo: 'PA-097',
    nombre: 'Coliformes totales',
    metodo: 'UNE-EN ISO 9308-1',
    limiteLegal: 0,
    precio: 24.9
  }
]

// @ai:begin seed-data — filas realistas del cliente (mismo shape RegisterParametroInput)
const CUSTOM: RegisterParametroInput[] = []
// @ai:end

export const SEED_PARAMETROS: RegisterParametroInput[] = [...DERIVED, ...CUSTOM]
