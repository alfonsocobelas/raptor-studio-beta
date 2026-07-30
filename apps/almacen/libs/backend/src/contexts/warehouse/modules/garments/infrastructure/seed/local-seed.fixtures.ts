import { RegisterGarmentInput } from '../../application/dtos/register-garment-input.dto'

// UUIDv7 deterministas (reproducibles entre ejecuciones); la idempotencia la dan
// los checks de unicidad del Register use case.
const DERIVED: RegisterGarmentInput[] = [
  {
    id: '019eb800-4d87-7000-8000-000000000001',
    sku: 'SEED-GARMENT-1',
    name: 'Name seed 1',
    category: 'tshirt',
    size: 'XS',
    price: 1,
    stock: 1,
    status: 'active'
  },
  {
    id: '019eb800-4d87-7000-8000-000000000002',
    sku: 'SEED-GARMENT-2',
    name: 'Name seed 2',
    category: 'trousers',
    size: 'S',
    price: 2,
    stock: 2,
    status: 'discontinued'
  }
]

// @ai:begin seed-data — filas realistas del cliente (mismo shape RegisterGarmentInput)
const CUSTOM: RegisterGarmentInput[] = [
  {
    id: '019eb802-0011-7000-8000-000000000001',
    sku: 'CAM-BAS-001',
    name: 'Camiseta básica cuello redondo',
    category: 'tshirt',
    size: 'M',
    brand: 'Norte Basics',
    color: 'Blanco',
    price: 9.95,
    stock: 240,
    status: 'active'
  },
  {
    id: '019eb802-0011-7000-8000-000000000002',
    sku: 'CAM-BAS-002',
    name: 'Camiseta básica cuello redondo',
    category: 'tshirt',
    size: 'L',
    brand: 'Norte Basics',
    color: 'Negro',
    price: 9.95,
    stock: 185,
    status: 'active'
  },
  {
    id: '019eb802-0011-7000-8000-000000000003',
    sku: 'CAM-EST-010',
    name: 'Camiseta estampada surf',
    category: 'tshirt',
    size: 'S',
    brand: 'Marea',
    color: 'Azul',
    price: 14.5,
    stock: 72,
    status: 'active'
  },
  {
    id: '019eb802-0011-7000-8000-000000000004',
    sku: 'PAN-VAQ-101',
    name: 'Vaquero slim fit',
    category: 'trousers',
    size: 'M',
    brand: 'Denim Co',
    color: 'Azul oscuro',
    price: 39.9,
    stock: 96,
    status: 'active'
  },
  {
    id: '019eb802-0011-7000-8000-000000000005',
    sku: 'PAN-VAQ-102',
    name: 'Vaquero regular',
    category: 'trousers',
    size: 'L',
    brand: 'Denim Co',
    color: 'Negro',
    price: 34.9,
    stock: 58,
    status: 'active'
  },
  {
    id: '019eb802-0011-7000-8000-000000000006',
    sku: 'PAN-CHI-110',
    name: 'Chino elástico',
    category: 'trousers',
    size: 'M',
    brand: 'Norte Basics',
    color: 'Beige',
    price: 29.95,
    stock: 44,
    status: 'active'
  },
  {
    id: '019eb802-0011-7000-8000-000000000007',
    sku: 'VES-FLO-201',
    name: 'Vestido flores midi',
    category: 'dress',
    size: 'S',
    brand: 'Alba',
    color: 'Estampado',
    price: 45.0,
    stock: 31,
    status: 'active'
  },
  {
    id: '019eb802-0011-7000-8000-000000000008',
    sku: 'VES-PUN-205',
    name: 'Vestido de punto',
    category: 'dress',
    size: 'M',
    brand: 'Alba',
    color: 'Granate',
    price: 39.5,
    stock: 18,
    status: 'active'
  },
  {
    id: '019eb802-0011-7000-8000-000000000009',
    sku: 'ABR-PLU-301',
    name: 'Plumas capucha',
    category: 'jacket',
    size: 'L',
    brand: 'Cumbre',
    color: 'Verde',
    price: 79.9,
    stock: 25,
    status: 'active'
  },
  {
    id: '019eb802-0011-7000-8000-000000000010',
    sku: 'ABR-TRE-305',
    name: 'Trenca paño',
    category: 'jacket',
    size: 'M',
    brand: 'Alba',
    color: 'Camel',
    price: 99.0,
    stock: 12,
    status: 'active'
  },
  {
    id: '019eb802-0011-7000-8000-000000000011',
    sku: 'ABR-CHU-310',
    name: 'Chubasquero plegable',
    category: 'jacket',
    size: 'XL',
    brand: 'Cumbre',
    color: 'Amarillo',
    price: 49.9,
    stock: 40,
    status: 'active'
  },
  {
    id: '019eb802-0011-7000-8000-000000000012',
    sku: 'ACC-GOR-401',
    name: 'Gorro lana merino',
    category: 'accessory',
    size: 'unique',
    brand: 'Cumbre',
    color: 'Gris',
    price: 15.9,
    stock: 110,
    status: 'active'
  },
  {
    id: '019eb802-0011-7000-8000-000000000013',
    sku: 'ACC-BUF-402',
    name: 'Bufanda punto grueso',
    category: 'accessory',
    size: 'unique',
    brand: 'Alba',
    color: 'Mostaza',
    price: 19.5,
    stock: 64,
    status: 'active'
  },
  {
    id: '019eb802-0011-7000-8000-000000000014',
    sku: 'ACC-CIN-405',
    name: 'Cinturón piel',
    category: 'accessory',
    size: 'unique',
    brand: 'Denim Co',
    color: 'Marrón',
    price: 24.0,
    stock: 37,
    status: 'active'
  },
  {
    id: '019eb802-0011-7000-8000-000000000015',
    sku: 'CAM-RAY-020',
    name: 'Camiseta rayas marinera',
    category: 'tshirt',
    size: 'M',
    brand: 'Marea',
    color: 'Azul/Blanco',
    price: 16.9,
    stock: 0,
    status: 'discontinued'
  },
  {
    id: '019eb802-0011-7000-8000-000000000016',
    sku: 'VES-LIN-210',
    name: 'Vestido lino verano',
    category: 'dress',
    size: 'L',
    brand: 'Marea',
    color: 'Crudo',
    price: 52.0,
    stock: 7,
    status: 'discontinued'
  }
]
// @ai:end

export const SEED_GARMENTS: RegisterGarmentInput[] = [...CUSTOM]
