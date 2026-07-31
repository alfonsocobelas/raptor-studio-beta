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
const CUSTOM: RegisterGarmentInput[] = []
// @ai:end

export const SEED_GARMENTS: RegisterGarmentInput[] = [...DERIVED, ...CUSTOM]
