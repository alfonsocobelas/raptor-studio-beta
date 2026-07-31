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
    id: '019eb800-4d87-7000-8000-000000000101',
    sku: 'TS-BAS-001',
    name: 'Camiseta básica algodón orgánico',
    category: 'tshirt',
    size: 'M',
    brand: 'Loom & Co',
    color: 'Blanco',
    price: 14.95,
    stock: 120,
    status: 'active'
  },
  {
    id: '019eb800-4d87-7000-8000-000000000102',
    sku: 'TS-BAS-002',
    name: 'Camiseta básica algodón orgánico',
    category: 'tshirt',
    size: 'L',
    brand: 'Loom & Co',
    color: 'Negro',
    price: 14.95,
    stock: 96,
    status: 'active'
  },
  {
    id: '019eb800-4d87-7000-8000-000000000103',
    sku: 'TS-GRA-010',
    name: 'Camiseta gráfica edición verano',
    category: 'tshirt',
    size: 'S',
    brand: 'Norte Studio',
    color: 'Arena',
    price: 22.5,
    stock: 34,
    status: 'active'
  },
  {
    id: '019eb800-4d87-7000-8000-000000000104',
    sku: 'PT-CHI-021',
    name: 'Pantalón chino slim',
    category: 'trousers',
    size: 'M',
    brand: 'Atlas Denim',
    color: 'Beige',
    price: 39.9,
    stock: 58,
    status: 'active'
  },
  {
    id: '019eb800-4d87-7000-8000-000000000105',
    sku: 'PT-VAQ-034',
    name: 'Vaquero recto lavado medio',
    category: 'trousers',
    size: 'L',
    brand: 'Atlas Denim',
    color: 'Azul índigo',
    price: 49.9,
    stock: 42,
    status: 'active'
  },
  {
    id: '019eb800-4d87-7000-8000-000000000106',
    sku: 'PT-JOG-040',
    name: 'Jogger felpa ligera',
    category: 'trousers',
    size: 'XL',
    brand: 'Loom & Co',
    color: 'Gris jaspeado',
    price: 29.9,
    stock: 4,
    status: 'active'
  },
  {
    id: '019eb800-4d87-7000-8000-000000000107',
    sku: 'VE-MID-051',
    name: 'Vestido midi estampado floral',
    category: 'dress',
    size: 'S',
    brand: 'Mar de Lino',
    color: 'Verde salvia',
    price: 59.0,
    stock: 26,
    status: 'active'
  },
  {
    id: '019eb800-4d87-7000-8000-000000000108',
    sku: 'VE-CAM-055',
    name: 'Vestido camisero lino',
    category: 'dress',
    size: 'M',
    brand: 'Mar de Lino',
    color: 'Crudo',
    price: 65.0,
    stock: 18,
    status: 'active'
  },
  {
    id: '019eb800-4d87-7000-8000-000000000109',
    sku: 'VE-NOC-060',
    name: 'Vestido de noche satinado',
    category: 'dress',
    size: 'M',
    brand: 'Norte Studio',
    color: 'Negro',
    price: 89.0,
    stock: 3,
    status: 'active'
  },
  {
    id: '019eb800-4d87-7000-8000-000000000110',
    sku: 'AB-PAR-071',
    name: 'Parka acolchada con capucha',
    category: 'jacket',
    size: 'L',
    brand: 'Cierzo Outdoor',
    color: 'Verde oliva',
    price: 119.0,
    stock: 21,
    status: 'active'
  },
  {
    id: '019eb800-4d87-7000-8000-000000000111',
    sku: 'AB-TRE-075',
    name: 'Trench clásico impermeable',
    category: 'jacket',
    size: 'M',
    brand: 'Norte Studio',
    color: 'Camel',
    price: 139.0,
    stock: 12,
    status: 'active'
  },
  {
    id: '019eb800-4d87-7000-8000-000000000112',
    sku: 'AB-BOM-080',
    name: 'Bomber reversible',
    category: 'jacket',
    size: 'S',
    brand: 'Atlas Denim',
    color: 'Granate',
    price: 79.0,
    stock: 2,
    status: 'discontinued'
  },
  {
    id: '019eb800-4d87-7000-8000-000000000113',
    sku: 'AC-GOR-091',
    name: 'Gorro de lana merina',
    category: 'accessory',
    size: 'unique',
    brand: 'Cierzo Outdoor',
    color: 'Mostaza',
    price: 19.9,
    stock: 64,
    status: 'active'
  },
  {
    id: '019eb800-4d87-7000-8000-000000000114',
    sku: 'AC-BUF-092',
    name: 'Bufanda jacquard',
    category: 'accessory',
    size: 'unique',
    brand: 'Mar de Lino',
    color: 'Multicolor',
    price: 24.9,
    stock: 48,
    status: 'active'
  },
  {
    id: '019eb800-4d87-7000-8000-000000000115',
    sku: 'AC-CIN-095',
    name: 'Cinturón de piel trenzada',
    category: 'accessory',
    size: 'unique',
    brand: 'Atlas Denim',
    color: 'Marrón',
    price: 29.5,
    stock: 5,
    status: 'active'
  }
]
// @ai:end

export const SEED_GARMENTS: RegisterGarmentInput[] = [...DERIVED, ...CUSTOM]
