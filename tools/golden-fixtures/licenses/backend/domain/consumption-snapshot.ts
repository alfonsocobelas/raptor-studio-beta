import { ConsumptionSnapshotProps } from './license-types'

// Fuente única de las fórmulas del snapshot de consumo (spec 26). El repositorio replica este
// mismo criterio en SQL (recompute/backfill); el test de integración fija que ambos coinciden.

// Tope de consumption_pct: la columna es NUMERIC(8,2) (máx 999.999,99). El ratio puede desbordarla
// cuando una licencia con licensedUnits minúsculo (ME_SAP sembrada desde materiales) se imputa a un
// consumo grande. Clampeamos aquí y en el SQL del repositorio (misma cifra) para que ni el snapshot en
// memoria ni el recompute aborten con 'numeric field overflow'. El % es una métrica de salud/orden, no
// una cifra financiera: por encima de este techo (~10.000× lo licenciado) la precisión no aporta.
export const MAX_CONSUMPTION_PCT = 999999.99

// pricePerUnit es la cuota ANUAL por unidad (el mapper de materiales lo siembra como AnnualFee/Quantity),
// por lo que el valor anual del material es units × pricePerUnit. Cuadra con la "Tasa anual" de SAP.
export function computeAnnualValue(licensedUnits: number, pricePerUnit: number): number {
  return licensedUnits * pricePerUnit
}

export function computeConsumptionPct(currentUnits: number, licensedUnits: number): number {
  const pct = licensedUnits > 0 ? (currentUnits / licensedUnits) * 100 : 0
  return Math.min(pct, MAX_CONSUMPTION_PCT)
}

// El snapshot es solo consumo (spec 42): annualValue salió a un campo propio de License.
export function computeConsumptionSnapshot(licensedUnits: number, currentUnits: number): ConsumptionSnapshotProps {
  return {
    currentUnits,
    consumptionPct: computeConsumptionPct(currentUnits, licensedUnits),
    excessUnits: Math.max(0, currentUnits - licensedUnits)
  }
}

// Licencia recién registrada (o aún sin columnas persistidas): nunca consumida.
export function initialConsumptionSnapshot(licensedUnits: number): ConsumptionSnapshotProps {
  return computeConsumptionSnapshot(licensedUnits, 0)
}
