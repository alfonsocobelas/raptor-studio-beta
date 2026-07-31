import { RegisterContractInput } from '../../application/dtos/register-contract-input.dto'

// UUIDv7 deterministas (reproducibles entre ejecuciones); la idempotencia la dan
// los checks de unicidad del Register use case.
const DERIVED: RegisterContractInput[] = [
  {
    id: '019eb800-b7e7-7000-8000-000000000001',
    contractType: 'cloud',
    contractNumber: 'ContractNumber seed 1',
    customerId: '019eb800-9a64-7000-8000-000000000001',
    customerName: 'CustomerName seed 1',
    status: 'active',
    source: 'AVVALE_SOLD',
    startDate: '2026-01-01',
    billingFrequency: 'monthly',
    renewalType: 'auto'
  },
  {
    id: '019eb800-b7e7-7000-8000-000000000002',
    contractType: 'onprem',
    contractNumber: 'ContractNumber seed 2',
    customerId: '019eb800-9a64-7000-8000-000000000002',
    customerName: 'CustomerName seed 2',
    status: 'expiring',
    source: 'CUSTOMER_OWNED',
    startDate: '2026-01-02',
    billingFrequency: 'quarterly',
    renewalType: 'manual'
  }
]

// @ai:begin seed-data — filas realistas del cliente (mismo shape RegisterContractInput)
const CUSTOM: RegisterContractInput[] = []
// @ai:end

export const SEED_CONTRACTS: RegisterContractInput[] = [...DERIVED, ...CUSTOM]
