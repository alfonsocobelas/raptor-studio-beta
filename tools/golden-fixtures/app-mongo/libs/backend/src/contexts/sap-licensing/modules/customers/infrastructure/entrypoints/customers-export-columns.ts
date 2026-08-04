import { ExportColumn } from '../../../../../shared/infrastructure/export/export-column'
import { CustomerPrimitiveProps } from '../../domain/customer-types'

const CUSTOMER_TYPE_LABELS: Record<string, string> = { cloud: 'Cloud', onprem: 'On-prem', hybrid: 'Hybrid' }

const label = (map: Record<string, string>, value: unknown): string => map[value as string] ?? String(value)

// Canonical export set: mirrors the customers table columns and labels, so the file matches the screen.
export const CUSTOMER_EXPORT_COLUMNS: ExportColumn<CustomerPrimitiveProps>[] = [
  { key: 'name', header: 'Nombre' },
  { key: 'customerType', header: 'Tipo', format: value => label(CUSTOMER_TYPE_LABELS, value) },
  { key: 'industry', header: 'Industria' },
  { key: 'taxId', header: 'CIF / NIF' },
  { key: 'city', header: 'Localidad' },
  { key: 'country', header: 'País' },
  { key: 'address', header: 'Dirección' },
  { key: 'phone', header: 'Teléfono' }
]
