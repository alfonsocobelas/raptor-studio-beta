import { computeConsumptionSnapshot } from '../../domain/consumption-snapshot'
import { classifyHealth } from '../../domain/license-health'
import { LicensePrimitiveProps, LicenseWithConsumption } from '../../domain/license-types'

// Read model desde el snapshot YA persistido (spec 26): no calcula nada — copia y clasifica la
// etiqueta de salud (que nunca se persiste) desde el pct guardado.
export function toLicenseReadModel(license: LicensePrimitiveProps): LicenseWithConsumption {
  return {
    ...license,
    solutionName: license.subSolutionAreaName,
    healthStatus: classifyHealth(license.consumptionPct)
  }
}

// Variante que recalcula desde un consumo dado (la usan los summaries hasta migrar en TASK-07).
export function enrichLicense(license: LicensePrimitiveProps, currentUnits: number): LicenseWithConsumption {
  const snapshot = computeConsumptionSnapshot(license.licensedUnits, currentUnits)
  return {
    ...license,
    ...snapshot,
    solutionName: license.subSolutionAreaName,
    healthStatus: classifyHealth(snapshot.consumptionPct)
  }
}
