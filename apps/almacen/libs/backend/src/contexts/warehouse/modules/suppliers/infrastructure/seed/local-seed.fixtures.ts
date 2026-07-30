import { RegisterSupplierInput } from '../../application/dtos/register-supplier-input.dto'

// UUIDv7 deterministas (reproducibles entre ejecuciones); la idempotencia la dan
// los checks de unicidad del Register use case.
const DERIVED: RegisterSupplierInput[] = [
  {
    id: '019eb800-0934-7000-8000-000000000001',
    name: 'Name seed 1',
    leadTimeDays: 1
  },
  {
    id: '019eb800-0934-7000-8000-000000000002',
    name: 'Name seed 2',
    leadTimeDays: 2
  }
]

// @ai:begin seed-data — filas realistas del cliente (mismo shape RegisterSupplierInput)
const CUSTOM: RegisterSupplierInput[] = [
  {
    id: '019eb802-0022-7000-8000-000000000001',
    name: 'Textiles del Norte SL',
    taxId: 'B15667788',
    email: 'pedidos@textilesnorte.es',
    phone: '981 442 105',
    city: 'A Coruña',
    leadTimeDays: 7
  },
  {
    id: '019eb802-0022-7000-8000-000000000002',
    name: 'Denim Co Distribución',
    taxId: 'B08991122',
    email: 'orders@denimco.es',
    phone: '933 208 441',
    city: 'Barcelona',
    leadTimeDays: 14
  },
  {
    id: '019eb802-0022-7000-8000-000000000003',
    name: 'Confecciones Alba SA',
    taxId: 'A28334455',
    email: 'comercial@alba.es',
    phone: '915 662 300',
    city: 'Madrid',
    leadTimeDays: 10
  },
  {
    id: '019eb802-0022-7000-8000-000000000004',
    name: 'Marea Surfwear SL',
    taxId: 'B36778899',
    email: 'hola@marea.surf',
    phone: '986 224 761',
    city: 'Vigo',
    leadTimeDays: 21
  },
  {
    id: '019eb802-0022-7000-8000-000000000005',
    name: 'Cumbre Outdoor SL',
    taxId: 'B31556677',
    email: 'ventas@cumbre.es',
    phone: '948 301 552',
    city: 'Pamplona',
    leadTimeDays: 12
  },
  {
    id: '019eb802-0022-7000-8000-000000000006',
    name: 'Complementos Ruiz e Hijos',
    taxId: 'B41222333',
    email: 'info@complementosruiz.es',
    phone: '954 118 007',
    city: 'Sevilla',
    leadTimeDays: 5
  }
]
// @ai:end

export const SEED_SUPPLIERS: RegisterSupplierInput[] = [...CUSTOM]
