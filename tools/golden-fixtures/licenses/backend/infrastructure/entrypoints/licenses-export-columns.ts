import { ExportColumn } from '../../../../../shared/infrastructure/export/export-column'
import { LicenseWithConsumption } from '../../domain/license-types'

const HEALTH_LABELS: Record<string, string> = {
  healthy: 'Saludable',
  underused: 'Infrautilizada',
  overused: 'Sobreuso',
  contractual_breach: 'Infracción'
}

// Canonical export set: mirrors the licenses table columns and labels, so the file matches the screen.
export const LICENSE_EXPORT_COLUMNS: ExportColumn<LicenseWithConsumption>[] = [
  { key: 'customerName', header: 'Cliente' },
  { key: 'subSolutionAreaName', header: 'Solución' },
  { key: 'contractNumber', header: 'Contrato' },
  { key: 'metric', header: 'Métrica' },
  { key: 'licensedUnits', header: 'Licenciadas' },
  { key: 'currentUnits', header: 'Consumo actual' },
  { key: 'consumptionPct', header: '% Consumo', format: value => `${(value as number).toFixed(1)}%` },
  { key: 'healthStatus', header: 'Estado salud', format: value => HEALTH_LABELS[value as string] ?? String(value) }
]
