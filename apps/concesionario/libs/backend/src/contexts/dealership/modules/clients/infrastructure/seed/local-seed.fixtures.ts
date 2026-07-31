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
    id: '019eb801-0022-7000-8000-000000000001',
    name: 'María Fernández Ruiz',
    clientType: 'individual',
    taxId: '71887342K',
    email: 'maria.fdez@gmail.com',
    phone: '612 448 902',
    city: 'Oviedo',
    address: 'C/ Uría 42, 3ºB',
    notes: ''
  },
  {
    id: '019eb801-0022-7000-8000-000000000002',
    name: 'Transportes Llanera SL',
    clientType: 'company',
    taxId: 'B33456789',
    email: 'flota@tllanera.es',
    phone: '985 771 240',
    city: 'Llanera',
    address: 'Pol. Ind. Silvota, nave 17',
    notes: ''
  },
  {
    id: '019eb801-0022-7000-8000-000000000003',
    name: 'José Antonio Cabal',
    clientType: 'individual',
    taxId: '10998877L',
    email: 'jacabal@outlook.es',
    phone: '655 209 118',
    city: 'Gijón',
    address: 'Av. de la Costa 118',
    notes: ''
  },
  {
    id: '019eb801-0022-7000-8000-000000000004',
    name: 'Lucía Menéndez Soto',
    clientType: 'individual',
    taxId: '53119876M',
    email: 'lucia.msoto@gmail.com',
    phone: '622 874 331',
    city: 'Avilés',
    address: 'C/ La Cámara 25',
    notes: ''
  },
  {
    id: '019eb801-0022-7000-8000-000000000005',
    name: 'Reformas Cantábrico SL',
    clientType: 'company',
    taxId: 'B33778899',
    email: 'oficina@rcantabrico.es',
    phone: '984 112 655',
    city: 'Gijón',
    address: 'C/ Marqués de San Esteban 30',
    notes: ''
  },
  {
    id: '019eb801-0022-7000-8000-000000000006',
    name: 'Carmen Suárez Vega',
    clientType: 'individual',
    taxId: '11223344P',
    email: 'csuarezv@gmail.com',
    phone: '645 733 208',
    city: 'Mieres',
    address: 'C/ Manuel Llaneza 60',
    notes: ''
  }
]
// @ai:end

export const SEED_CLIENTS: RegisterClientInput[] = [...CUSTOM]
