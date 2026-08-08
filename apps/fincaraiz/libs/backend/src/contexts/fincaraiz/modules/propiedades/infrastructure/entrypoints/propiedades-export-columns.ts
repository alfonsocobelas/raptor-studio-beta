import { ExportColumn } from '../../../../../shared/infrastructure/export/export-column'
import { PropiedadPrimitiveProps } from '../../domain/propiedad-types'

const ESTADO_LABELS: Record<string, string> = {
  disponible: 'Disponible',
  reservada: 'Reservada',
  vendida: 'Vendida',
  retirada: 'Retirada'
}

const label = (map: Record<string, string>, value: unknown): string => map[value as string] ?? String(value)

// Canonical export set: mirrors the propiedades table columns and labels, so the file matches the screen.
export const PROPIEDAD_EXPORT_COLUMNS: ExportColumn<PropiedadPrimitiveProps>[] = [
  { key: 'titulo', header: 'Título' },
  { key: 'zona', header: 'Zona' },
  { key: 'estado', header: 'Estado', format: value => label(ESTADO_LABELS, value) },
  { key: 'metrosCuadrados', header: 'Metros cuadrados' },
  { key: 'habitaciones', header: 'Habitaciones' },
  { key: 'precio', header: 'Precio' },
  { key: 'fechaAlta', header: 'Fecha de alta' },
  { key: 'exclusiva', header: 'En exclusiva' },
  { key: 'agenteName', header: 'Agente' }
]
