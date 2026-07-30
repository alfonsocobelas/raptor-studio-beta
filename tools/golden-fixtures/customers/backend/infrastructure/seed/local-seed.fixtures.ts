import { RegisterCustomerInput } from '../../application/dtos/register-customer-input.dto'

// UUIDv7 deterministas (reproducibles entre ejecuciones); la idempotencia la dan
// los checks de unicidad del Register use case.
const DERIVED: RegisterCustomerInput[] = [
  {
    id: '019eb800-9a64-7000-8000-000000000001',
    sapId: 'SEED-CUSTOMER-1',
    name: 'Name seed 1',
    customerType: 'cloud'
  },
  {
    id: '019eb800-9a64-7000-8000-000000000002',
    sapId: 'SEED-CUSTOMER-2',
    name: 'Name seed 2',
    customerType: 'onprem'
  }
]

// @ai:begin seed-data — filas realistas del cliente (mismo shape RegisterCustomerInput)
const CUSTOM: RegisterCustomerInput[] = []
// @ai:end

export const SEED_CUSTOMERS: RegisterCustomerInput[] = [...DERIVED, ...CUSTOM]
