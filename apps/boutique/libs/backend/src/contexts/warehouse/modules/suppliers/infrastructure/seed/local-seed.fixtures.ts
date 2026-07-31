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
    id: '019eb800-0934-7000-8000-000000000101',
    name: 'Tejidos del Norte S.L.',
    taxId: 'B31804321',
    email: 'pedidos@tejidosdelnorte.es',
    phone: '+34 948 210 334',
    city: 'Pamplona',
    leadTimeDays: 7
  },
  {
    id: '019eb800-0934-7000-8000-000000000102',
    name: 'Confecciones Mediterráneo',
    taxId: 'B46112208',
    email: 'ventas@confmediterraneo.com',
    phone: '+34 963 552 018',
    city: 'Valencia',
    leadTimeDays: 12
  },
  {
    id: '019eb800-0934-7000-8000-000000000103',
    name: 'Portuguesa de Malhas Lda.',
    taxId: 'PT509442187',
    email: 'export@pmalhas.pt',
    phone: '+351 253 604 220',
    city: 'Braga',
    leadTimeDays: 15
  },
  {
    id: '019eb800-0934-7000-8000-000000000104',
    name: 'Accesorios Rivera',
    taxId: 'B08663412',
    email: 'info@accesoriosrivera.es',
    phone: '+34 932 184 775',
    city: 'Barcelona',
    leadTimeDays: 5
  }
]
// @ai:end

export const SEED_SUPPLIERS: RegisterSupplierInput[] = [...DERIVED, ...CUSTOM]
