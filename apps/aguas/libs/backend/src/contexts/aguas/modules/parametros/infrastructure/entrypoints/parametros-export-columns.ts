import { ExportColumn } from '../../../../../shared/infrastructure/export/export-column'
import { ParametroPrimitiveProps } from '../../domain/parametro-types'

// Canonical export set: mirrors the parametros table columns and labels, so the file matches the screen.
export const PARAMETRO_EXPORT_COLUMNS: ExportColumn<ParametroPrimitiveProps>[] = [
  { key: 'codigo', header: 'Código' },
  { key: 'nombre', header: 'Nombre' },
  { key: 'metodo', header: 'Método' },
  { key: 'limiteLegal', header: 'Límite legal' },
  { key: 'precio', header: 'Precio' }
]
