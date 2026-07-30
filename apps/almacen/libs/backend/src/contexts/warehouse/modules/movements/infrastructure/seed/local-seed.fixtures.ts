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
const CUSTOM: RegisterMovementInput[] = [
  {
    id: '019eb802-0033-7000-8000-000000000001',
    reference: 'M-2026-0301',
    movementDate: '2026-07-29',
    movementType: 'in',
    garmentLabel: 'Camiseta básica cuello redondo (M)',
    quantity: 120,
    counterparty: 'Textiles del Norte SL',
    reason: 'purchase'
  },
  {
    id: '019eb802-0033-7000-8000-000000000002',
    reference: 'M-2026-0300',
    movementDate: '2026-07-28',
    movementType: 'out',
    garmentLabel: 'Vaquero slim fit (M)',
    quantity: 24,
    counterparty: 'Tienda Centro',
    reason: 'sale'
  },
  {
    id: '019eb802-0033-7000-8000-000000000003',
    reference: 'M-2026-0299',
    movementDate: '2026-07-25',
    movementType: 'out',
    garmentLabel: 'Plumas capucha (L)',
    quantity: 6,
    counterparty: 'Tienda Norte',
    reason: 'sale'
  },
  {
    id: '019eb802-0033-7000-8000-000000000004',
    reference: 'M-2026-0298',
    movementDate: '2026-07-22',
    movementType: 'in',
    garmentLabel: 'Vestido flores midi (S)',
    quantity: 25,
    counterparty: 'Confecciones Alba SA',
    reason: 'purchase'
  },
  {
    id: '019eb802-0033-7000-8000-000000000005',
    reference: 'M-2026-0297',
    movementDate: '2026-07-18',
    movementType: 'out',
    garmentLabel: 'Gorro lana merino',
    quantity: 30,
    counterparty: 'Outlet online',
    reason: 'sale'
  },
  {
    id: '019eb802-0033-7000-8000-000000000006',
    reference: 'M-2026-0296',
    movementDate: '2026-07-15',
    movementType: 'in',
    garmentLabel: 'Chubasquero plegable (XL)',
    quantity: 40,
    counterparty: 'Cumbre Outdoor SL',
    reason: 'purchase'
  },
  {
    id: '019eb802-0033-7000-8000-000000000007',
    reference: 'M-2026-0295',
    movementDate: '2026-07-11',
    movementType: 'in',
    garmentLabel: 'Camiseta estampada surf (S)',
    quantity: 60,
    counterparty: 'Marea Surfwear SL',
    reason: 'purchase'
  },
  {
    id: '019eb802-0033-7000-8000-000000000008',
    reference: 'M-2026-0294',
    movementDate: '2026-07-08',
    movementType: 'out',
    garmentLabel: 'Vestido de punto (M)',
    quantity: 4,
    counterparty: 'Tienda Centro',
    reason: 'sale'
  },
  {
    id: '019eb802-0033-7000-8000-000000000009',
    reference: 'M-2026-0293',
    movementDate: '2026-07-04',
    movementType: 'in',
    garmentLabel: 'Vaquero slim fit (M)',
    quantity: 8,
    counterparty: 'Tienda Norte',
    reason: 'return'
  },
  {
    id: '019eb802-0033-7000-8000-000000000010',
    reference: 'M-2026-0292',
    movementDate: '2026-07-01',
    movementType: 'out',
    garmentLabel: 'Bufanda punto grueso',
    quantity: 2,
    counterparty: 'Rotura en manipulación',
    reason: 'adjustment'
  },
  {
    id: '019eb802-0033-7000-8000-000000000011',
    reference: 'M-2026-0291',
    movementDate: '2026-06-27',
    movementType: 'out',
    garmentLabel: 'Cinturón piel',
    quantity: 12,
    counterparty: 'Tienda Sur',
    reason: 'sale'
  },
  {
    id: '019eb802-0033-7000-8000-000000000012',
    reference: 'M-2026-0290',
    movementDate: '2026-06-24',
    movementType: 'in',
    garmentLabel: 'Trenca paño (M)',
    quantity: 12,
    counterparty: 'Confecciones Alba SA',
    reason: 'purchase'
  }
]
// @ai:end

export const SEED_MOVEMENTS: RegisterMovementInput[] = [...CUSTOM]
