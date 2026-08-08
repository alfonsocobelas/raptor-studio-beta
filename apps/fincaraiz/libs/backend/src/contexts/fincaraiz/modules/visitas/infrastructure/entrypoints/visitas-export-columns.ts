import { ExportColumn } from '../../../../../shared/infrastructure/export/export-column'
import { VisitaPrimitiveProps } from '../../domain/visita-types'

// Canonical export set: mirrors the visitas table columns and labels, so the file matches the screen.
export const VISITA_EXPORT_COLUMNS: ExportColumn<VisitaPrimitiveProps>[] = [
  { key: 'referencia', header: 'Referencia' },
  { key: 'fecha', header: 'Fecha' },
  { key: 'interesado', header: 'Interesado' },
  { key: 'observaciones', header: 'Observaciones' },
  { key: 'confirmada', header: 'Confirmada' },
  { key: 'propiedadName', header: 'Propiedad' }
]
