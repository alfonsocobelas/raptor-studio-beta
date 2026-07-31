import { ExportColumn } from '../../../../../shared/infrastructure/export/export-column'
import { ProjectPrimitiveProps } from '../../domain/project-types'

const STATUS_LABELS: Record<string, string> = {
  planning: 'Planificación',
  active: 'Activo',
  onhold: 'En pausa',
  closed: 'Cerrado'
}
const IMPLEMENTER_LABELS: Record<string, string> = { AVVALE: 'AVVALE', THIRD_PARTY: 'Tercero' }

const label = (map: Record<string, string>, value: unknown): string => map[value as string] ?? String(value)

// Canonical export set: mirrors the projects table columns and labels, so the file matches the screen.
export const PROJECT_EXPORT_COLUMNS: ExportColumn<ProjectPrimitiveProps>[] = [
  { key: 'name', header: 'Nombre' },
  { key: 'customerName', header: 'Cliente' },
  { key: 'startDate', header: 'Fecha inicio' },
  { key: 'endDate', header: 'Fecha fin' },
  { key: 'status', header: 'Estado', format: value => label(STATUS_LABELS, value) },
  { key: 'implementer', header: 'Implementador', format: value => label(IMPLEMENTER_LABELS, value) }
]
