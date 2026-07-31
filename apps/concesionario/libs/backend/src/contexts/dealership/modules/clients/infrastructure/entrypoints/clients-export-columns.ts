import { ExportColumn } from '../../../../../shared/infrastructure/export/export-column'
import { ClientPrimitiveProps } from '../../domain/client-types'

const CLIENT_TYPE_LABELS: Record<string, string> = { individual: 'Particular', company: 'Empresa' }

const label = (map: Record<string, string>, value: unknown): string => map[value as string] ?? String(value)

// Canonical export set: mirrors the clients table columns and labels, so the file matches the screen.
export const CLIENT_EXPORT_COLUMNS: ExportColumn<ClientPrimitiveProps>[] = [
  { key: 'name', header: 'Nombre' },
  { key: 'clientType', header: 'Tipo', format: value => label(CLIENT_TYPE_LABELS, value) },
  { key: 'taxId', header: 'DNI / CIF' },
  { key: 'email', header: 'Email' },
  { key: 'phone', header: 'Teléfono' },
  { key: 'city', header: 'Localidad' }
]
