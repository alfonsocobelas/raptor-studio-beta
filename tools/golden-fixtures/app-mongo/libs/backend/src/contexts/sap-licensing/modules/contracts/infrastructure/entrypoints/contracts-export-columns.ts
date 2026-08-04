import { ExportColumn } from '../../../../../shared/infrastructure/export/export-column'
import { ContractPrimitiveProps } from '../../domain/contract-types'

const CONTRACT_TYPE_LABELS: Record<string, string> = {
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

const label = (map: Record<string, string>, value: unknown): string => map[value as string] ?? String(value)

// Canonical export set: mirrors the contracts table columns and labels, so the file matches the screen.
export const CONTRACT_EXPORT_COLUMNS: ExportColumn<ContractPrimitiveProps>[] = [
  { key: 'contractNumber', header: 'Nº Contrato' },
  { key: 'customerName', header: 'Cliente' },
  { key: 'contractType', header: 'Tipo', format: value => label(CONTRACT_TYPE_LABELS, value) },
  { key: 'startDate', header: 'Inicio' },
  { key: 'endDate', header: 'Fin' },
  { key: 'status', header: 'Estado', format: value => label(STATUS_LABELS, value) },
  { key: 'totalValue', header: 'Valor total' },
  { key: 'billingFrequency', header: 'Facturación' }
]
