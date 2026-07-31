import { RegisterMovementInput } from '../../application/dtos/register-movement-input.dto'

// UUIDv7 deterministas (reproducibles entre ejecuciones); la idempotencia la dan
// los checks de unicidad del Register use case.
const DERIVED: RegisterMovementInput[] = [
  {
    id: '019eb800-1baf-7000-8000-000000000001',
    reference: 'SEED-MOVEMENT-1',
    movementDate: '2026-01-01',
    movementType: 'in',
    garmentLabel: 'GarmentLabel seed 1',
    quantity: 1,
    reason: 'purchase'
  },
  {
    id: '019eb800-1baf-7000-8000-000000000002',
    reference: 'SEED-MOVEMENT-2',
    movementDate: '2026-01-02',
    movementType: 'out',
    garmentLabel: 'GarmentLabel seed 2',
    quantity: 2,
    reason: 'sale'
  }
]

// @ai:begin seed-data — filas realistas del cliente (mismo shape RegisterMovementInput)
const CUSTOM: RegisterMovementInput[] = []
// @ai:end

export const SEED_MOVEMENTS: RegisterMovementInput[] = [...DERIVED, ...CUSTOM]
