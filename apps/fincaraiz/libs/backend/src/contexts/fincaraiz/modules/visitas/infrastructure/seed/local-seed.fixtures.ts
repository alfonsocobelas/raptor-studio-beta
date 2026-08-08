import { RegisterVisitaInput } from '../../application/dtos/register-visita-input.dto'

// UUIDv7 deterministas (reproducibles entre ejecuciones); la idempotencia la dan
// los checks de unicidad del Register use case.
const DERIVED: RegisterVisitaInput[] = [
  {
    id: '019eb800-6016-7000-8000-000000000001',
    referencia: 'VIS-5001',
    fecha: '2026-08-04',
    interesado: 'Familia Robles',
    observaciones: 'Buscan luz y ascensor',
    confirmada: true,
    propiedadId: '019eb800-c54e-7000-8000-000000000001',
    propiedadName: 'Ático con terraza en Chamberí'
  },
  {
    id: '019eb800-6016-7000-8000-000000000002',
    referencia: 'VIS-5002',
    fecha: '2026-08-05',
    interesado: 'Marc Vilalta',
    observaciones: 'Le encaja pero pide rebaja',
    confirmada: true,
    propiedadId: '019eb800-c54e-7000-8000-000000000002',
    propiedadName: 'Piso reformado en Gros'
  },
  {
    id: '019eb800-6016-7000-8000-000000000003',
    referencia: 'VIS-5003',
    fecha: '2026-08-06',
    interesado: 'Inés Guerrero',
    observaciones: 'Quiere segunda visita',
    confirmada: false,
    propiedadId: '019eb800-c54e-7000-8000-000000000003',
    propiedadName: 'Casa adosada en Boadilla'
  },
  {
    id: '019eb800-6016-7000-8000-000000000004',
    referencia: 'VIS-5004',
    fecha: '2026-08-07',
    interesado: 'Tomás Feijóo',
    observaciones: 'Descarta por planta baja',
    confirmada: true,
    propiedadId: '019eb800-c54e-7000-8000-000000000004',
    propiedadName: 'Loft en el Born'
  },
  {
    id: '019eb800-6016-7000-8000-000000000005',
    referencia: 'VIS-5005',
    fecha: '2026-08-10',
    interesado: 'Laura Aymerich',
    observaciones: 'Interesada en alquiler con opción a compra',
    confirmada: false,
    propiedadId: '019eb800-c54e-7000-8000-000000000005',
    propiedadName: 'Dúplex frente al Sardinero'
  },
  {
    id: '019eb800-6016-7000-8000-000000000006',
    referencia: 'VIS-5006',
    fecha: '2026-08-11',
    interesado: 'Sergio Otero',
    observaciones: 'Pide informe de la comunidad',
    confirmada: true,
    propiedadId: '019eb800-c54e-7000-8000-000000000006',
    propiedadName: 'Chalet con piscina en Pozuelo'
  },
  {
    id: '019eb800-6016-7000-8000-000000000007',
    referencia: 'VIS-5007',
    fecha: '2026-08-12',
    interesado: 'Bea Quintana',
    observaciones: 'Solo mira, sin financiación',
    confirmada: true,
    propiedadId: '019eb800-c54e-7000-8000-000000000007',
    propiedadName: 'Estudio en Malasaña'
  },
  {
    id: '019eb800-6016-7000-8000-000000000008',
    referencia: 'VIS-5008',
    fecha: '2026-08-13',
    interesado: 'Álvaro Sendín',
    observaciones: 'Muy interesado, hará oferta',
    confirmada: false,
    propiedadId: '019eb800-c54e-7000-8000-000000000008',
    propiedadName: 'Piso luminoso en Ruzafa'
  },
  {
    id: '019eb800-6016-7000-8000-000000000009',
    referencia: 'VIS-5009',
    fecha: '2026-08-14',
    interesado: 'Nadia Belkacem',
    observaciones: 'Necesita plaza de garaje',
    confirmada: true,
    propiedadId: '019eb800-c54e-7000-8000-000000000009',
    propiedadName: 'Bajo con jardín en Aravaca'
  },
  {
    id: '019eb800-6016-7000-8000-000000000010',
    referencia: 'VIS-5010',
    fecha: '2026-08-17',
    interesado: 'Rubén Toledo',
    observaciones: 'Comparará con otra de la zona',
    confirmada: false,
    propiedadId: '019eb800-c54e-7000-8000-000000000010',
    propiedadName: 'Apartamento en Playa de la Victoria'
  }
]

// @ai:begin seed-data — filas realistas del cliente (mismo shape RegisterVisitaInput)
const CUSTOM: RegisterVisitaInput[] = []
// @ai:end

export const SEED_VISITAS: RegisterVisitaInput[] = [...DERIVED, ...CUSTOM]
