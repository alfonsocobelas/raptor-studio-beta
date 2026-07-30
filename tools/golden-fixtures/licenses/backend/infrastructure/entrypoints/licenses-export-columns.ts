import { ExportColumn } from '../../../../../shared/infrastructure/export/export-column'
import { LicensePrimitiveProps } from '../../domain/license-types'

// Canonical export set: mirrors the licenses table columns and labels, so the file matches the screen.
export const LICENSE_EXPORT_COLUMNS: ExportColumn<LicensePrimitiveProps>[] = [
  { key: 'customerName', header: 'Cliente' },
  { key: 'subSolutionAreaName', header: 'Solución' },
  { key: 'contractNumber', header: 'Contrato' },
  { key: 'metric', header: 'Métrica' },
  { key: 'licensedUnits', header: 'Licenciadas' },
  { key: 'currentUnits', header: 'Consumo actual' }
]
