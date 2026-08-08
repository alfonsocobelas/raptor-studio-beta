import { RegisterPropiedadInput } from '../../application/dtos/register-propiedad-input.dto'

// UUIDv7 deterministas (reproducibles entre ejecuciones); la idempotencia la dan
// los checks de unicidad del Register use case.
const DERIVED: RegisterPropiedadInput[] = [
  {
    id: '019eb800-c54e-7000-8000-000000000001',
    titulo: 'Ático con terraza en Chamberí',
    zona: 'Chamberí, Madrid',
    estado: 'disponible',
    metrosCuadrados: 92,
    habitaciones: 3,
    precio: 615000,
    fechaAlta: '2026-01-09',
    exclusiva: true,
    agenteId: '019eb800-74b8-7000-8000-000000000001',
    agenteName: 'Nuria Salgado Vera'
  },
  {
    id: '019eb800-c54e-7000-8000-000000000002',
    titulo: 'Piso reformado en Gros',
    zona: 'Gros, San Sebastián',
    estado: 'reservada',
    metrosCuadrados: 78,
    habitaciones: 2,
    precio: 398000,
    fechaAlta: '2026-01-23',
    exclusiva: false,
    agenteId: '019eb800-74b8-7000-8000-000000000002',
    agenteName: 'Óscar Delgado Ibarra'
  },
  {
    id: '019eb800-c54e-7000-8000-000000000003',
    titulo: 'Casa adosada en Boadilla',
    zona: 'Boadilla del Monte',
    estado: 'vendida',
    metrosCuadrados: 210,
    habitaciones: 4,
    precio: 749000,
    fechaAlta: '2026-02-04',
    exclusiva: true,
    agenteId: '019eb800-74b8-7000-8000-000000000003',
    agenteName: 'Paula Montes Cid'
  },
  {
    id: '019eb800-c54e-7000-8000-000000000004',
    titulo: 'Loft en el Born',
    zona: 'El Born, Barcelona',
    estado: 'retirada',
    metrosCuadrados: 64,
    habitaciones: 1,
    precio: 465000,
    fechaAlta: '2026-02-19',
    exclusiva: true,
    agenteId: '019eb800-74b8-7000-8000-000000000004',
    agenteName: 'Raúl Cifuentes Amo'
  },
  {
    id: '019eb800-c54e-7000-8000-000000000005',
    titulo: 'Dúplex frente al Sardinero',
    zona: 'Sardinero, Santander',
    estado: 'disponible',
    metrosCuadrados: 118,
    habitaciones: 3,
    precio: 289000,
    fechaAlta: '2026-03-02',
    exclusiva: false,
    agenteId: '019eb800-74b8-7000-8000-000000000005',
    agenteName: 'Silvia Bermejo Lasa'
  },
  {
    id: '019eb800-c54e-7000-8000-000000000006',
    titulo: 'Chalet con piscina en Pozuelo',
    zona: 'Pozuelo de Alarcón',
    estado: 'reservada',
    metrosCuadrados: 340,
    habitaciones: 5,
    precio: 1250000,
    fechaAlta: '2026-03-17',
    exclusiva: true,
    agenteId: '019eb800-74b8-7000-8000-000000000001',
    agenteName: 'Nuria Salgado Vera'
  },
  {
    id: '019eb800-c54e-7000-8000-000000000007',
    titulo: 'Estudio en Malasaña',
    zona: 'Malasaña, Madrid',
    estado: 'vendida',
    metrosCuadrados: 38,
    habitaciones: 1,
    precio: 198000,
    fechaAlta: '2026-03-28',
    exclusiva: false,
    agenteId: '019eb800-74b8-7000-8000-000000000002',
    agenteName: 'Óscar Delgado Ibarra'
  },
  {
    id: '019eb800-c54e-7000-8000-000000000008',
    titulo: 'Piso luminoso en Ruzafa',
    zona: 'Ruzafa, Valencia',
    estado: 'retirada',
    metrosCuadrados: 86,
    habitaciones: 3,
    precio: 342000,
    fechaAlta: '2026-04-11',
    exclusiva: true,
    agenteId: '019eb800-74b8-7000-8000-000000000003',
    agenteName: 'Paula Montes Cid'
  },
  {
    id: '019eb800-c54e-7000-8000-000000000009',
    titulo: 'Bajo con jardín en Aravaca',
    zona: 'Aravaca, Madrid',
    estado: 'disponible',
    metrosCuadrados: 150,
    habitaciones: 4,
    precio: 880000,
    fechaAlta: '2026-04-25',
    exclusiva: true,
    agenteId: '019eb800-74b8-7000-8000-000000000004',
    agenteName: 'Raúl Cifuentes Amo'
  },
  {
    id: '019eb800-c54e-7000-8000-000000000010',
    titulo: 'Apartamento en Playa de la Victoria',
    zona: 'Cádiz',
    estado: 'reservada',
    metrosCuadrados: 55,
    habitaciones: 2,
    precio: 265000,
    fechaAlta: '2026-05-08',
    exclusiva: false,
    agenteId: '019eb800-74b8-7000-8000-000000000005',
    agenteName: 'Silvia Bermejo Lasa'
  }
]

// @ai:begin seed-data — filas realistas del cliente (mismo shape RegisterPropiedadInput)
const CUSTOM: RegisterPropiedadInput[] = []
// @ai:end

export const SEED_PROPIEDADES: RegisterPropiedadInput[] = [...DERIVED, ...CUSTOM]
