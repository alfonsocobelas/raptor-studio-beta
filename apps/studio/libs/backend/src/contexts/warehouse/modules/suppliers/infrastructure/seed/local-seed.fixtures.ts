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
const CUSTOM: RegisterSupplierInput[] = []
// @ai:end

export const SEED_SUPPLIERS: RegisterSupplierInput[] = [...DERIVED, ...CUSTOM]
