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
    id: '019eb800-1baf-7000-8000-000000000101',
    reference: 'MOV-2026-0101',
    movementDate: '2026-07-02',
    movementType: 'in',
    garmentLabel: 'Camiseta básica algodón orgánico (TS-BAS-001)',
    quantity: 80,
    counterparty: 'Tejidos del Norte S.L.',
    reason: 'purchase'
  },
  {
    id: '019eb800-1baf-7000-8000-000000000102',
    reference: 'MOV-2026-0102',
    movementDate: '2026-07-05',
    movementType: 'in',
    garmentLabel: 'Vaquero recto lavado medio (PT-VAQ-034)',
    quantity: 50,
    counterparty: 'Confecciones Mediterráneo',
    reason: 'purchase'
  },
  {
    id: '019eb800-1baf-7000-8000-000000000103',
    reference: 'MOV-2026-0103',
    movementDate: '2026-07-08',
    movementType: 'out',
    garmentLabel: 'Camiseta básica algodón orgánico (TS-BAS-001)',
    quantity: 24,
    counterparty: 'Tienda Gran Vía',
    reason: 'sale'
  },
  {
    id: '019eb800-1baf-7000-8000-000000000104',
    reference: 'MOV-2026-0104',
    movementDate: '2026-07-11',
    movementType: 'in',
    garmentLabel: 'Vestido midi estampado floral (VE-MID-051)',
    quantity: 30,
    counterparty: 'Portuguesa de Malhas Lda.',
    reason: 'purchase'
  },
  {
    id: '019eb800-1baf-7000-8000-000000000105',
    reference: 'MOV-2026-0105',
    movementDate: '2026-07-15',
    movementType: 'out',
    garmentLabel: 'Vestido midi estampado floral (VE-MID-051)',
    quantity: 4,
    counterparty: 'Tienda Gran Vía',
    reason: 'sale'
  },
  {
    id: '019eb800-1baf-7000-8000-000000000106',
    reference: 'MOV-2026-0106',
    movementDate: '2026-07-18',
    movementType: 'out',
    garmentLabel: 'Parka acolchada con capucha (AB-PAR-071)',
    quantity: 2,
    counterparty: 'Cliente online #48211',
    reason: 'sale'
  },
  {
    id: '019eb800-1baf-7000-8000-000000000107',
    reference: 'MOV-2026-0107',
    movementDate: '2026-07-21',
    movementType: 'in',
    garmentLabel: 'Vestido camisero lino (VE-CAM-055)',
    quantity: 1,
    counterparty: 'Cliente online #48007',
    reason: 'return'
  },
  {
    id: '019eb800-1baf-7000-8000-000000000108',
    reference: 'MOV-2026-0108',
    movementDate: '2026-07-24',
    movementType: 'out',
    garmentLabel: 'Gorro de lana merina (AC-GOR-091)',
    quantity: 6,
    counterparty: 'Tienda Sol',
    reason: 'sale'
  },
  {
    id: '019eb800-1baf-7000-8000-000000000109',
    reference: 'MOV-2026-0109',
    movementDate: '2026-07-28',
    movementType: 'out',
    garmentLabel: 'Bomber reversible (AB-BOM-080)',
    quantity: 3,
    counterparty: 'Ajuste tras inventario físico',
    reason: 'adjustment'
  },
  {
    id: '019eb800-1baf-7000-8000-000000000110',
    reference: 'MOV-2026-0110',
    movementDate: '2026-07-30',
    movementType: 'in',
    garmentLabel: 'Cinturón de piel trenzada (AC-CIN-095)',
    quantity: 12,
    counterparty: 'Accesorios Rivera',
    reason: 'purchase'
  }
]
// @ai:end

export const SEED_MOVEMENTS: RegisterMovementInput[] = [...DERIVED, ...CUSTOM]
