import { ExportColumn } from '../../../../../shared/infrastructure/export/export-column'
import { AgentePrimitiveProps } from '../../domain/agente-types'

// Canonical export set: mirrors the agentes table columns and labels, so the file matches the screen.
export const AGENTE_EXPORT_COLUMNS: ExportColumn<AgentePrimitiveProps>[] = [
  { key: 'nombre', header: 'Nombre' },
  { key: 'email', header: 'Email' },
  { key: 'telefono', header: 'Teléfono' },
  { key: 'comisionPorcentaje', header: 'Comisión (%)' },
  { key: 'activo', header: 'Activo' }
]
