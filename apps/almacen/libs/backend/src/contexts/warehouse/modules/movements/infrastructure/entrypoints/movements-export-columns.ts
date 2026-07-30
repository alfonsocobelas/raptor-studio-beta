import { ExportColumn } from '../../../../../shared/infrastructure/export/export-column'
import { MovementPrimitiveProps } from '../../domain/movement-types'

const MOVEMENT_TYPE_LABELS: Record<string, string> = { in: 'Entrada', out: 'Salida' }
const REASON_LABELS: Record<string, string> = {
  purchase: 'Compra',
  sale: 'Venta',
  return: 'Devolución',
  adjustment: 'Ajuste'
}

const label = (map: Record<string, string>, value: unknown): string => map[value as string] ?? String(value)

// Canonical export set: mirrors the movements table columns and labels, so the file matches the screen.
export const MOVEMENT_EXPORT_COLUMNS: ExportColumn<MovementPrimitiveProps>[] = [
  { key: 'reference', header: 'Referencia' },
  { key: 'movementDate', header: 'Fecha' },
  { key: 'movementType', header: 'Tipo', format: value => label(MOVEMENT_TYPE_LABELS, value) },
  { key: 'garmentLabel', header: 'Prenda' },
  { key: 'quantity', header: 'Unidades' },
  { key: 'counterparty', header: 'Origen / destino' },
  { key: 'reason', header: 'Motivo', format: value => label(REASON_LABELS, value) }
]
