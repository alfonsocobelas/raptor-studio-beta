import { ExportColumn } from '../../../../../shared/infrastructure/export/export-column'
import { SupplierPrimitiveProps } from '../../domain/supplier-types'

// Canonical export set: mirrors the suppliers table columns and labels, so the file matches the screen.
export const SUPPLIER_EXPORT_COLUMNS: ExportColumn<SupplierPrimitiveProps>[] = [
  { key: 'name', header: 'Proveedor' },
  { key: 'taxId', header: 'CIF' },
  { key: 'email', header: 'Email' },
  { key: 'phone', header: 'Teléfono' },
  { key: 'city', header: 'Ciudad' },
  { key: 'leadTimeDays', header: 'Plazo (días)' }
]
