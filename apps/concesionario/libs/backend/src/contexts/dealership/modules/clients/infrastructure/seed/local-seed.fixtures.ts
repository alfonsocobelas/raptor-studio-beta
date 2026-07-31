import { RegisterClientInput } from '../../application/dtos/register-client-input.dto'

// UUIDv7 deterministas (reproducibles entre ejecuciones); la idempotencia la dan
// los checks de unicidad del Register use case.
const DERIVED: RegisterClientInput[] = [
  {
    id: '019eb800-cad6-7000-8000-000000000001',
    name: 'Name seed 1',
    clientType: 'individual'
  },
  {
    id: '019eb800-cad6-7000-8000-000000000002',
    name: 'Name seed 2',
    clientType: 'company'
  }
]

// @ai:begin seed-data — filas realistas del cliente (mismo shape RegisterClientInput)
const CUSTOM: RegisterClientInput[] = [
  {
    id: '019eb800-cad6-7000-8000-000000000101',
    name: 'Laura Fernández Ruiz',
    clientType: 'individual',
    taxId: '48291736K',
    email: 'laura.fernandez@example.com',
    phone: '+34 612 334 908',
    city: 'Madrid'
  },
  {
    id: '019eb800-cad6-7000-8000-000000000102',
    name: 'Transportes Iberia SL',
    clientType: 'company',
    taxId: 'B84920175',
    email: 'flota@transportesiberia.example.com',
    phone: '+34 915 402 118',
    city: 'Getafe',
    notes: 'Cliente de flota: renovación anual de 3-4 unidades'
  },
  {
    id: '019eb800-cad6-7000-8000-000000000103',
    name: 'Miguel Ángel Soto Prada',
    clientType: 'individual',
    taxId: '30177492M',
    email: 'masoto@example.com',
    phone: '+34 655 210 443',
    city: 'Alcorcón'
  },
  {
    id: '019eb800-cad6-7000-8000-000000000104',
    name: 'Clínica Dental Sonrisa SLU',
    clientType: 'company',
    taxId: 'B87340021',
    email: 'admin@sonrisa.example.com',
    phone: '+34 918 776 230',
    city: 'Madrid',
    notes: 'Renting de vehículo de empresa'
  },
  {
    id: '019eb800-cad6-7000-8000-000000000105',
    name: 'Carmen Ortega Vidal',
    clientType: 'individual',
    taxId: '51920384J',
    email: 'carmen.ortega@example.com',
    phone: '+34 699 481 275',
    city: 'Móstoles'
  },
  {
    id: '019eb800-cad6-7000-8000-000000000106',
    name: 'Javier Lamas Castro',
    clientType: 'individual',
    taxId: '05873910T',
    email: 'jlamas@example.com',
    phone: '+34 622 907 514',
    city: 'Leganés'
  },
  {
    id: '019eb800-cad6-7000-8000-000000000107',
    name: 'Reformas Vega Hermanos SL',
    clientType: 'company',
    taxId: 'B82114906',
    email: 'oficina@vegahermanos.example.com',
    phone: '+34 916 350 872',
    city: 'Fuenlabrada'
  },
  {
    id: '019eb800-cad6-7000-8000-000000000108',
    name: 'Ana Belén Cruz Marín',
    clientType: 'individual',
    taxId: '44012987R',
    email: 'ab.cruz@example.com',
    phone: '+34 638 224 190',
    city: 'Madrid'
  }
]
// @ai:end

export const SEED_CLIENTS: RegisterClientInput[] = [...DERIVED, ...CUSTOM]
