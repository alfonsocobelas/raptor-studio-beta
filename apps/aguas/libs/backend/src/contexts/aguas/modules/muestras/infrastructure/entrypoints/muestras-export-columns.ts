import { ExportColumn } from '../../../../../shared/infrastructure/export/export-column'
import { MuestraPrimitiveProps } from '../../domain/muestra-types'

const ESTADO_LABELS: Record<string, string> = {
  recibida: 'Recibida',
  en_analisis: 'En análisis',
  fuera_de_rango: 'Fuera de rango',
  validada: 'Validada',
  informada: 'Informada',
  facturada: 'Facturada'
}

const label = (map: Record<string, string>, value: unknown): string => map[value as string] ?? String(value)

// Canonical export set: mirrors the muestras table columns and labels, so the file matches the screen.
export const MUESTRA_EXPORT_COLUMNS: ExportColumn<MuestraPrimitiveProps>[] = [
  { key: 'codigo', header: 'Código' },
  { key: 'estado', header: 'Estado', format: value => label(ESTADO_LABELS, value) },
  { key: 'tecnico', header: 'Técnico' },
  { key: 'recogida', header: 'Recogida' },
  { key: 'limiteInforme', header: 'Límite de informe' },
  { key: 'importe', header: 'Importe' },
  { key: 'puntoName', header: 'Punto de muestreo' }
]
