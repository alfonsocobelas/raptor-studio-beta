import { ExportColumn } from '../../../../../shared/infrastructure/export/export-column'
import { CustomerPrimitiveProps } from '../../domain/customer-types'

// Same labels as the list badge (spec 43); null (ventana transitoria) exports as blank, not "null".
const CUSTOMER_TYPE_LABELS: Record<string, string> = { cloud: 'Cloud', onprem: 'On-prem', hybrid: 'Hybrid' }
const customerTypeLabel = (value: unknown): string =>
  value === null ? '' : (CUSTOMER_TYPE_LABELS[value as string] ?? String(value))

export const CUSTOMER_EXPORT_COLUMNS: ExportColumn<CustomerPrimitiveProps>[] = [
  { key: 'name', header: 'Nombre' },
  { key: 'customerType', header: 'Tipo', format: customerTypeLabel },
  { key: 'industry', header: 'Industria' },
  { key: 'taxId', header: 'CIF / NIF' },
  { key: 'city', header: 'Localidad' },
  { key: 'country', header: 'País' },
  { key: 'address', header: 'Dirección' },
  { key: 'phone', header: 'Teléfono' }
]
