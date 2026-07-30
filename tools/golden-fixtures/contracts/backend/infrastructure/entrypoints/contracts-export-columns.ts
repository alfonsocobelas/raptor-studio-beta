import { ExportColumn } from '../../../../../shared/infrastructure/export/export-column'
import { ContractPrimitiveProps } from '../../domain/contract-types'

const TYPE_LABELS: Record<string, string> = {
  cloud: 'Cloud',
  onprem: 'On-premise',
  mixed: 'Mixto',
  maintenance: 'Mantenimiento'
}
const STATUS_LABELS: Record<string, string> = {
  active: 'Activo',
  expiring: 'Por expirar',
  expired: 'Expirado',
  terminated: 'Terminado'
}
const SOURCE_LABELS: Record<string, string> = { AVVALE_SOLD: 'Avvale', CUSTOMER_OWNED: 'Cliente' }

const label = (map: Record<string, string>, value: unknown): string => map[value as string] ?? String(value)
// Maintenance contracts carry no number/start (ISMaintenances doesn't publish them, spec 44).
const dashIfNull = (value: unknown): string => (value === null || value === undefined ? '—' : String(value))

// Canonical export set: mirrors the contracts table columns and labels, so the file matches the screen.
export const CONTRACT_EXPORT_COLUMNS: ExportColumn<ContractPrimitiveProps>[] = [
  { key: 'contractNumber', header: 'Nº Contrato', format: dashIfNull },
  { key: 'customerName', header: 'Cliente' },
  { key: 'contractType', header: 'Tipo', format: value => label(TYPE_LABELS, value) },
  { key: 'startDate', header: 'Inicio', format: dashIfNull },
  { key: 'endDate', header: 'Fin' },
  { key: 'status', header: 'Estado', format: value => label(STATUS_LABELS, value) },
  { key: 'totalValue', header: 'Valor total' },
  { key: 'source', header: 'Origen', format: value => label(SOURCE_LABELS, value) },
  { key: 'billingFrequency', header: 'Facturación' }
]
