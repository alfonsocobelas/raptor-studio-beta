import { RegisterCustomerInput } from '../../application/dtos/register-customer-input.dto'
import { ContactPrimitiveProps } from '../../domain/customer-types'

// UUIDv7 deterministas. El 2º grupo actúa como categoría: 0001 clientes mock,
// 0002 clientes demo, 0003 contactos. Reproducibles entre ejecuciones.
const customerId = (n: number): string => `019eb800-0001-7000-8000-${pad(n)}`
const demoCustomerId = (n: number): string => `019eb800-0002-7000-8000-${pad(n)}`
const contactId = (n: number): string => `019eb800-0003-7000-8000-${pad(n)}`
const pad = (n: number): string => n.toString().padStart(12, '0')

// Los 8 clientes del mockup (aurora-catalyst-prototype/.../sap-customers.service.ts).
// `sapId` mock asignado (el mockup no lo trae).
const MOCKUP_CUSTOMERS: RegisterCustomerInput[] = [
  {
    id: customerId(1),
    sapId: '9000001',
    name: 'Ferrovial Construcción S.A.',
    taxId: 'A28019206',
    industry: 'Construction & Infrastructure',
    address: 'Príncipe de Vergara 135, 28002 Madrid',
    phone: '+34 91 586 25 00',
    customerType: 'hybrid'
  },
  {
    id: customerId(2),
    sapId: '9000002',
    name: 'Mercadona S.A.',
    taxId: 'A46103834',
    industry: 'Retail',
    address: 'Ciudad de la Industria 5, 46930 Valencia',
    phone: '+34 96 388 33 33',
    customerType: 'cloud'
  },
  {
    id: customerId(3),
    sapId: '9000003',
    name: 'Inditex Group',
    taxId: 'A15075062',
    industry: 'Fashion Retail',
    address: 'Av. de la Diputación s/n, 15142 Arteixo (A Coruña)',
    phone: '+34 981 185 400',
    customerType: 'cloud'
  },
  {
    id: customerId(4),
    sapId: '9000004',
    name: 'Iberdrola S.A.',
    taxId: 'A48010615',
    industry: 'Energy & Utilities',
    address: 'Plaza Euskadi 5, 48009 Bilbao',
    phone: '+34 944 151 411',
    customerType: 'onprem'
  },
  {
    id: customerId(5),
    sapId: '9000005',
    name: 'Grupo Logista',
    taxId: 'A28021302',
    industry: 'Logistics & Distribution',
    address: 'Trigo 39, 28914 Leganés (Madrid)',
    phone: '+34 91 481 71 00',
    customerType: 'hybrid'
  },
  {
    id: customerId(6),
    sapId: '9000006',
    name: 'Laboratorios Rovi',
    taxId: 'A28041283',
    industry: 'Pharmaceutical',
    address: 'Julián Camarillo 35, 28037 Madrid',
    phone: '+34 91 375 62 30',
    customerType: 'onprem'
  },
  {
    id: customerId(7),
    sapId: '9000007',
    name: 'Acciona Energía',
    taxId: 'A31171945',
    industry: 'Renewable Energy',
    address: 'Avda. Europa 18, 28108 Alcobendas',
    phone: '+34 91 663 28 50',
    customerType: 'cloud'
  },
  {
    id: customerId(8),
    sapId: '9000008',
    name: 'Puig Brands',
    taxId: 'A08105591',
    industry: 'Cosmetics & Fragrance',
    address: 'Travesera de Gracia 11, 08021 Barcelona',
    phone: '+34 93 254 42 00',
    customerType: 'hybrid'
  }
]

// Clientes demo sintéticos (empresas ficticias) para superar el pageSize por defecto (20),
// validar el paginado y dar variedad realista a filtros y búsquedas. Conservan los ids
// deterministas (0002) y los sapId 9100001-9100020 de la primera versión del seed, así que
// la idempotencia se mantiene sobre una BD ya sembrada.
interface DemoCustomerSpec {
  name: string
  taxId: string
  industry: string
  address: string
  phone: string
}

const DEMO_CUSTOMER_SPECS: DemoCustomerSpec[] = [
  {
    name: 'Aceros del Cantábrico S.A.',
    taxId: 'A33101001',
    industry: 'Steel & Metallurgy',
    address: 'Polígono de Maqua 12, 33410 Avilés (Asturias)',
    phone: '+34 985 512 340'
  },
  {
    name: 'Bodegas Riofrío S.L.',
    taxId: 'B26102002',
    industry: 'Food & Beverage',
    address: 'Camino del Ebro 45, 26006 Logroño',
    phone: '+34 941 234 567'
  },
  {
    name: 'Naviera Atlántica S.A.',
    taxId: 'A36103003',
    industry: 'Maritime Transport',
    address: 'Muelle de Bouzas s/n, 36208 Vigo',
    phone: '+34 986 447 890'
  },
  {
    name: 'Grupo Asegurador Levante S.A.',
    taxId: 'A46104004',
    industry: 'Insurance',
    address: 'Av. Aragón 30, 46021 Valencia',
    phone: '+34 96 337 21 00'
  },
  {
    name: 'Banca Meridional S.A.',
    taxId: 'A41105005',
    industry: 'Banking',
    address: 'Av. de la Palmera 8, 41012 Sevilla',
    phone: '+34 95 448 60 00'
  },
  {
    name: 'Textiles Bergara S.L.',
    taxId: 'B20106006',
    industry: 'Textile Manufacturing',
    address: 'Ibargarai Kalea 3, 20570 Bergara (Gipuzkoa)',
    phone: '+34 943 761 234'
  },
  {
    name: 'Cerámicas Castellón S.A.',
    taxId: 'A12107007',
    industry: 'Ceramics & Building Materials',
    address: 'Ctra. de Alcora km 9, 12006 Castellón de la Plana',
    phone: '+34 964 342 100'
  },
  {
    name: 'Distribuciones Alimentarias del Sur S.L.',
    taxId: 'B29108008',
    industry: 'Food Distribution',
    address: 'Polígono Guadalhorce, Calle Diderot 14, 29004 Málaga',
    phone: '+34 952 176 543'
  },
  {
    name: 'Química Ebro S.A.',
    taxId: 'A50109009',
    industry: 'Chemicals',
    address: 'Ctra. de Castellón km 3.4, 50013 Zaragoza',
    phone: '+34 976 465 800'
  },
  {
    name: 'Clínicas Mediterráneo S.L.',
    taxId: 'B03110010',
    industry: 'Healthcare',
    address: 'Av. de Denia 78, 03016 Alicante',
    phone: '+34 965 268 000'
  },
  {
    name: 'Autopartes Galicia S.L.',
    taxId: 'B36111011',
    industry: 'Automotive',
    address: 'Av. Citroën 3, 36210 Vigo',
    phone: '+34 986 215 400'
  },
  {
    name: 'Editorial Meseta S.A.',
    taxId: 'A47112012',
    industry: 'Media & Publishing',
    address: 'Paseo de Zorrilla 101, 47007 Valladolid',
    phone: '+34 983 457 890'
  },
  {
    name: 'Hoteles Costa Brava Group S.A.',
    taxId: 'A17113013',
    industry: 'Hospitality & Tourism',
    address: 'Passeig del Mar 22, 17220 Sant Feliu de Guíxols (Girona)',
    phone: '+34 972 321 100'
  },
  {
    name: 'Aerocomponentes Getafe S.A.',
    taxId: 'A28114014',
    industry: 'Aerospace',
    address: 'Av. John Lennon 2, 28906 Getafe (Madrid)',
    phone: '+34 91 624 30 00'
  },
  {
    name: 'Hortofrutícola Almería S.C.A.',
    taxId: 'F04115015',
    industry: 'Agriculture',
    address: 'Ctra. de Níjar km 21, 04120 Almería',
    phone: '+34 950 293 456'
  },
  {
    name: 'Telecomunicaciones del Norte S.A.',
    taxId: 'A39116016',
    industry: 'Telecommunications',
    address: 'Calle Alta 15, 39008 Santander',
    phone: '+34 942 318 700'
  },
  {
    name: 'Muebles Yecla S.L.',
    taxId: 'B30117017',
    industry: 'Furniture Manufacturing',
    address: 'Av. de la Feria 40, 30510 Yecla (Murcia)',
    phone: '+34 968 751 234'
  },
  {
    name: 'Papelera del Segre S.A.',
    taxId: 'A25118018',
    industry: 'Paper & Packaging',
    address: 'Polígono El Segre, Calle Josep Baró 7, 25191 Lleida',
    phone: '+34 973 201 500'
  },
  {
    name: 'Vidrios La Mancha S.L.',
    taxId: 'B13119019',
    industry: 'Glass Manufacturing',
    address: 'Ctra. de Carrión km 4, 13005 Ciudad Real',
    phone: '+34 926 274 890'
  },
  {
    name: 'Transportes Meseta Central S.A.',
    taxId: 'A28120020',
    industry: 'Road Transport & Logistics',
    address: 'Centro de Transportes de Coslada, 28821 Coslada (Madrid)',
    phone: '+34 91 669 45 00'
  }
]

// Rotación cloud/onprem/hybrid: da variedad realista al filtro/badge de tipo sin datos reales.
const DEMO_CUSTOMER_TYPES: RegisterCustomerInput['customerType'][] = ['cloud', 'onprem', 'hybrid']

const DEMO_CUSTOMERS: RegisterCustomerInput[] = DEMO_CUSTOMER_SPECS.map((spec, i) => {
  const n = i + 1
  return {
    id: demoCustomerId(n),
    sapId: `9100${n.toString().padStart(3, '0')}`,
    name: spec.name,
    taxId: spec.taxId,
    industry: spec.industry,
    address: spec.address,
    phone: spec.phone,
    customerType: DEMO_CUSTOMER_TYPES[i % DEMO_CUSTOMER_TYPES.length]
  }
})

export const SEED_CUSTOMERS: RegisterCustomerInput[] = [...MOCKUP_CUSTOMERS, ...DEMO_CUSTOMERS]

// Un contacto primario por cliente demo, para que su detalle no quede vacío.
const DEMO_CONTACT_SPECS: Array<{ name: string; role: string; email: string }> = [
  { name: 'Marta Costales', role: 'IT Manager', email: 'm.costales@aceroscantabrico.example' },
  { name: 'Íñigo Sáenz', role: 'Director Financiero', email: 'i.saenz@bodegasriofrio.example' },
  { name: 'Rosa Barreiro', role: 'CIO', email: 'r.barreiro@navieraatlantica.example' },
  { name: 'Vicente Llopis', role: 'Responsable de Sistemas', email: 'v.llopis@aseguradorlevante.example' },
  { name: 'Elena Robles', role: 'CTO', email: 'e.robles@bancameridional.example' },
  { name: 'Ane Zubizarreta', role: 'Directora de Operaciones', email: 'a.zubizarreta@textilesbergara.example' },
  { name: 'Jorge Mundina', role: 'IT Director', email: 'j.mundina@ceramicascastellon.example' },
  { name: 'Sonia Heredia', role: 'Responsable ERP', email: 's.heredia@dialsur.example' },
  { name: 'Alberto Lasheras', role: 'CIO', email: 'a.lasheras@quimicaebro.example' },
  { name: 'Nuria Ferrándiz', role: 'Directora de Tecnología', email: 'n.ferrandiz@clinicasmediterraneo.example' },
  { name: 'Brais Otero', role: 'IT Manager', email: 'b.otero@autopartesgalicia.example' },
  { name: 'Clara Villanueva', role: 'Directora Digital', email: 'c.villanueva@editorialmeseta.example' },
  { name: 'Pau Riera', role: 'Revenue Manager', email: 'p.riera@hotelescostabrava.example' },
  { name: 'Diego Antón', role: 'Head of IT', email: 'd.anton@aerogetafe.example' },
  { name: 'Isabel Góngora', role: 'Gerente', email: 'i.gongora@hortoalmeria.example' },
  { name: 'Rubén Cagigas', role: 'CTO', email: 'r.cagigas@telenorte.example' },
  { name: 'Josefa Ortuño', role: 'Responsable de Administración', email: 'j.ortuno@mueblesyecla.example' },
  { name: 'Xavier Pané', role: 'IT Manager', email: 'x.pane@papeleradelsegre.example' },
  { name: 'Manuel Espinosa', role: 'Director de Producción', email: 'm.espinosa@vidrioslamancha.example' },
  { name: 'Teresa Galiano', role: 'Directora de Logística', email: 't.galiano@transportesmeseta.example' }
]

const DEMO_CONTACTS: ContactPrimitiveProps[] = DEMO_CONTACT_SPECS.map((spec, i) => {
  const n = i + 1
  return {
    id: contactId(10 + n),
    customerId: demoCustomerId(n),
    name: spec.name,
    role: spec.role,
    email: spec.email,
    phone: `+34 610 ${(100 + n).toString()} ${(200 + n).toString()}`,
    isPrimary: true
  }
})

// Contactos del mockup (MOCK_CONTACTS), ligados a su cliente por el UUID sembrado.
const MOCKUP_CONTACTS: ContactPrimitiveProps[] = [
  {
    id: contactId(1),
    customerId: customerId(1),
    name: 'Javier Ruiz de Alda',
    role: 'CIO',
    email: 'j.ruiz@ferrovial.com',
    phone: '+34 600 100 101',
    isPrimary: true
  },
  {
    id: contactId(2),
    customerId: customerId(1),
    name: 'Lucía Martínez',
    role: 'SAP Competency Lead',
    email: 'l.martinez@ferrovial.com',
    phone: '+34 600 100 102',
    isPrimary: false
  },
  {
    id: contactId(3),
    customerId: customerId(2),
    name: 'Pablo Domenech',
    role: 'IT Director',
    email: 'p.domenech@mercadona.es',
    phone: '+34 600 200 201',
    isPrimary: true
  },
  {
    id: contactId(4),
    customerId: customerId(3),
    name: 'Andrea Pérez',
    role: 'VP Technology',
    email: 'a.perez@inditex.com',
    phone: '+34 600 300 301',
    isPrimary: true
  },
  {
    id: contactId(5),
    customerId: customerId(3),
    name: 'Marc Soler',
    role: 'Head of ERP Platforms',
    email: 'm.soler@inditex.com',
    phone: '+34 600 300 302',
    isPrimary: false
  },
  {
    id: contactId(6),
    customerId: customerId(4),
    name: 'Iker Aranguren',
    role: 'CIO',
    email: 'i.aranguren@iberdrola.es',
    phone: '+34 600 400 401',
    isPrimary: true
  },
  {
    id: contactId(7),
    customerId: customerId(5),
    name: 'Carmen Iglesias',
    role: 'IT Operations Director',
    email: 'c.iglesias@logista.com',
    phone: '+34 600 500 501',
    isPrimary: true
  },
  {
    id: contactId(8),
    customerId: customerId(6),
    name: 'Raúl Fernández',
    role: 'Digital Transformation Lead',
    email: 'r.fernandez@rovi.es',
    phone: '+34 600 600 601',
    isPrimary: true
  },
  {
    id: contactId(9),
    customerId: customerId(7),
    name: 'Cristina Maier',
    role: 'Global SAP Manager',
    email: 'c.maier@acciona.com',
    phone: '+34 600 700 701',
    isPrimary: true
  },
  {
    id: contactId(10),
    customerId: customerId(8),
    name: 'Òscar Vidal',
    role: 'CDO',
    email: 'o.vidal@puig.com',
    phone: '+34 600 800 801',
    isPrimary: true
  }
]

export const SEED_CONTACTS: ContactPrimitiveProps[] = [...MOCKUP_CONTACTS, ...DEMO_CONTACTS]
