import { ExportColumn } from '../../../../../shared/infrastructure/export/export-column'
import { SalePrimitiveProps } from '../../domain/sale-types'

const PAYMENT_METHOD_LABELS: Record<string, string> = { cash: 'Contado', financing: 'Financiación', leasing: 'Renting' }
const STATUS_LABELS: Record<string, string> = {
  pending: 'Pdte. entrega',
  delivered: 'Entregada',
  cancelled: 'Cancelada'
}

const label = (map: Record<string, string>, value: unknown): string => map[value as string] ?? String(value)

// Canonical export set: mirrors the sales table columns and labels, so the file matches the screen.
export const SALE_EXPORT_COLUMNS: ExportColumn<SalePrimitiveProps>[] = [
  { key: 'reference', header: 'Referencia' },
  { key: 'saleDate', header: 'Fecha' },
  { key: 'vehicleLabel', header: 'Vehículo' },
  { key: 'clientLabel', header: 'Cliente' },
  { key: 'salesperson', header: 'Comercial' },
  { key: 'amount', header: 'Importe' },
  { key: 'paymentMethod', header: 'Pago', format: value => label(PAYMENT_METHOD_LABELS, value) },
  { key: 'status', header: 'Estado', format: value => label(STATUS_LABELS, value) }
]
