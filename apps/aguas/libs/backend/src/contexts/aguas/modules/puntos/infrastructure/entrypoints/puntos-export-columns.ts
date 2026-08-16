import { ExportColumn } from '../../../../../shared/infrastructure/export/export-column'
import { PuntoPrimitiveProps } from '../../domain/punto-types'

const TIPO_AGUA_LABELS: Record<string, string> = {
  potable: 'Potable',
  riego: 'Riego',
  residual: 'Residual',
  proceso: 'De proceso'
}

const label = (map: Record<string, string>, value: unknown): string => map[value as string] ?? String(value)

// Canonical export set: mirrors the puntos table columns and labels, so the file matches the screen.
export const PUNTO_EXPORT_COLUMNS: ExportColumn<PuntoPrimitiveProps>[] = [
  { key: 'nombre', header: 'Nombre' },
  { key: 'tipoAgua', header: 'Tipo de agua', format: value => label(TIPO_AGUA_LABELS, value) },
  { key: 'direccion', header: 'Dirección' },
  { key: 'coordenadas', header: 'Coordenadas' },
  { key: 'obligatorio', header: 'Control obligatorio' },
  { key: 'clienteName', header: 'Cliente' }
]
