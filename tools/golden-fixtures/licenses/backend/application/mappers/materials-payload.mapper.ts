import { Nullable } from '../../../../../shared/domain/types'
import { SyncLicenseMaterial } from '../dtos/sync-licenses-from-materials-input.dto'

export interface MaterialsPayloadOutput {
  materials: SyncLicenseMaterial[]
  skippedInvalid: number
}

// Mapa Unit (SAP) → metric enum del dominio. Lo no mapeado cae en 'custom' (verificado en vivo:
// Unit es muy diverso — Users/User/Tenant/Contacts/Spend/Flat Fee/Transaction/Objects…).
const UNIT_TO_METRIC: Record<string, string> = {
  user: 'user',
  users: 'user',
  fue: 'FUE',
  transaction: 'transaction',
  transactions: 'transaction',
  document: 'document',
  documents: 'document',
  objects: 'document'
}

/**
 * Maps the raw ContractCurrentMaterialsRedesign payload (spec 33) into license sync records,
 * one per material. Deduplicates by (contractNumber, materialId) — a contract has several
 * ContractsRedesign rows/orders and each returns its subset, so the orchestrator unions them.
 * Rows without contract number / material id, or with a non-positive quantity, are dropped and
 * reported via skippedInvalid. pricePerUnit is seeded from AnnualFee/Quantity (0 when no fee).
 * The material's CustomerId (sold-to) is deliberately ignored: the customer is resolved by contract.
 */
export class MaterialsPayloadMapper {
  static toSyncRecords(materials: Record<string, unknown>[]): MaterialsPayloadOutput {
    const byKey = new Map<string, SyncLicenseMaterial>()
    let skippedInvalid = 0

    for (const row of materials) {
      const contractNumber = String(row.SapID ?? '')
      const materialId = String(row.MaterialId ?? '')
      const licensedUnits = this.parsePositive(row.Quantity)
      if (!contractNumber || !materialId || licensedUnits === null) {
        skippedInvalid += 1
        continue
      }

      const key = `${contractNumber}#${materialId}`
      if (byKey.has(key)) {
        continue
      }

      byKey.set(key, {
        contractNumber,
        materialId,
        metricName: String(row.MaterialName ?? row.ProductName ?? ''),
        subSolutionAreaName: String(row.SubSolutionName ?? ''),
        metric: this.mapUnit(row.Unit),
        licensedUnits,
        pricePerUnit: this.seedPrice(row.AnnualFee, licensedUnits),
        // Tasa anual autoritativa de SAP (spec 42): el importe crudo, sin dividir/reconstruir; 0 si no hay fee.
        annualValue: this.parsePositive(row.AnnualFee) ?? 0,
        contractEndDate: String(row.ContractEnd ?? '') || null
      })
    }

    return { materials: [...byKey.values()], skippedInvalid }
  }

  private static mapUnit(unit: unknown): string {
    return (
      UNIT_TO_METRIC[
        String(unit ?? '')
          .trim()
          .toLowerCase()
      ] ?? 'custom'
    )
  }

  // Cuota anual / unidades; 0 si no hay importe (tenant demo trae AnnualFee 0).
  private static seedPrice(annualFee: unknown, units: number): number {
    const fee = Number(annualFee)
    if (!Number.isFinite(fee) || fee <= 0 || units <= 0) {
      return 0
    }
    return fee / units
  }

  // Quantity llega como string ('35', '5.0'); solo válido si es un número > 0 (LicensedUnits exige >= 1).
  private static parsePositive(value: unknown): Nullable<number> {
    const parsed = typeof value === 'number' ? value : Number(String(value ?? '').trim())
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return null
    }
    return parsed
  }
}
