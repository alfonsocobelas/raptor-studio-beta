import { ExportColumn } from '../../../../../shared/infrastructure/export/export-column'
import { ClientePrimitiveProps } from '../../domain/cliente-types'

const TIPO_LABELS: Record<string, string> = {
  ayuntamiento: 'Ayuntamiento',
  regantes: 'Comunidad de regantes',
  alimentacion: 'Empresa de alimentación'
}

const label = (map: Record<string, string>, value: unknown): string => map[value as string] ?? String(value)

// Canonical export set: mirrors the clientes table columns and labels, so the file matches the screen.
export const CLIENTE_EXPORT_COLUMNS: ExportColumn<ClientePrimitiveProps>[] = [
  { key: 'nombre', header: 'Nombre' },
  { key: 'tipo', header: 'Tipo', format: value => label(TIPO_LABELS, value) },
  { key: 'telefono', header: 'Teléfono' },
  { key: 'localidad', header: 'Localidad' }
]
