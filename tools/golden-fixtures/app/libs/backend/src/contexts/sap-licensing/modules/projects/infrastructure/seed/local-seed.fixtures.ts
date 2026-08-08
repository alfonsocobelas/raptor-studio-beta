import { RegisterProjectInput } from '../../application/dtos/register-project-input.dto'

// UUIDv7 deterministas (reproducibles entre ejecuciones); la idempotencia la dan
// los checks de unicidad del Register use case.
const DERIVED: RegisterProjectInput[] = [
  {
    id: '019eb800-fc2c-7000-8000-000000000001',
    customerId: '019eb800-9a64-7000-8000-000000000001',
    customerName: 'CustomerName seed 1',
    name: 'Name seed 1',
    startDate: '2026-01-01',
    endDate: '2026-07-28',
    status: 'planning',
    implementer: 'AVVALE'
  },
  {
    id: '019eb800-fc2c-7000-8000-000000000002',
    customerId: '019eb800-9a64-7000-8000-000000000002',
    customerName: 'CustomerName seed 2',
    name: 'Name seed 2',
    startDate: '2026-02-01',
    endDate: '2026-08-28',
    status: 'active',
    implementer: 'THIRD_PARTY'
  }
]

// @ai:begin seed-data — filas realistas del cliente (mismo shape RegisterProjectInput)
const CUSTOM: RegisterProjectInput[] = []
// @ai:end

export const SEED_PROJECTS: RegisterProjectInput[] = [...DERIVED, ...CUSTOM]
