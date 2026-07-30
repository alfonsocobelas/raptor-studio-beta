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
    name: 'Clínica Dental Nalón',
    clientType: 'company',
    taxId: 'B33111222',
    email: 'admin@dentalnalon.es',
    phone: '985 660 402',
    city: 'Langreo',
    address: 'C/ Dorado 8, bajo',
    notes: ''
  },
  {
    id: '019eb801-0022-7000-8000-000000000005',
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
    id: '019eb801-0022-7000-8000-000000000006',
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
    id: '019eb801-0022-7000-8000-000000000007',
    name: 'Pablo Iglesias Noval',
    clientType: 'individual',
    taxId: '09887766N',
    email: 'pablo.noval@icloud.com',
    phone: '678 015 992',
    city: 'Oviedo',
    address: 'C/ Foncalada 11',
    notes: ''
  },
  {
    id: '019eb801-0022-7000-8000-000000000008',
    name: 'Carmen Suárez Vega',
    clientType: 'individual',
    taxId: '11223344P',
    email: 'csuarezv@gmail.com',
    phone: '645 733 208',
    city: 'Mieres',
    address: 'C/ Manuel Llaneza 60',
    notes: ''
  },
  {
    id: '019eb801-0022-7000-8000-000000000009',
    name: 'Asesoría Buenavista',
    clientType: 'company',
    taxId: 'B33223344',
    email: 'info@asbuenavista.es',
    phone: '985 234 871',
    city: 'Oviedo',
    address: 'C/ Fray Ceferino 15, 2º',
    notes: ''
  },
  {
    id: '019eb801-0022-7000-8000-000000000010',
    name: 'Diego Álvarez Pando',
    clientType: 'individual',
    taxId: '71554433Q',
    email: 'dalvarezp@gmail.com',
    phone: '699 481 553',
    city: 'Siero',
    address: 'C/ Ramón y Cajal 4',
    notes: ''
  },
  {
    id: '019eb801-0022-7000-8000-000000000011',
    name: 'Panadería El Hórreo SL',
    clientType: 'company',
    taxId: 'B33665544',
    email: 'pedidos@elhorreo.es',
    phone: '985 508 314',
    city: 'Grado',
    address: 'Plaza General Ponte 3',
    notes: ''
  },
  {
    id: '019eb801-0022-7000-8000-000000000012',
    name: 'Sara Castaño Vigil',
    clientType: 'individual',
    taxId: '32998811R',
    email: 'sara.cv@gmail.com',
    phone: '611 902 476',
    city: 'Gijón',
    address: 'C/ Corrida 55, 4ºA',
    notes: ''
  }
]
// @ai:end

export const SEED_CLIENTS: RegisterClientInput[] = [...CUSTOM]
