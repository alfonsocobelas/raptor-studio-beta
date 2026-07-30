import { Nullable } from '../../../../../shared/domain/types'
import { SyncMaintenanceRecord } from '../dtos/sync-maintenance-input.dto'
import { RENEWAL_TYPE_BY_SAP_LABEL } from './contracts-payload.mapper'

export interface MaintenancePayloadOutput {
  maintenances: SyncMaintenanceRecord[]
  skippedInvalid: number
}

// SAP marca "sin contrato asociado" con este literal (62/174 filas en vivo, 2026-07-21).
const NO_CONTRACT_SENTINEL = 'N/A'

/**
 * Maps the raw OData payload of ISMaintenances (finance) into maintenance contract sync records.
 * The feed carries ONE ROW PER POSITION (PosNr) of a maintenance contract (ID): rows are grouped
 * by ID summing their fees (identity in the current sample — every ID had a single position in the
 * 2026-07-21 probe — but the feed models multi-position, so the aggregation stays). Per-contract
 * fields come from the first row of the group. ContractID "N/A" maps to a null contractNumber:
 * the upsert key is the cmsCaseId (= ID). Only CURRENT rows are taken (defensive: 174/174 CURRENT
 * live). Rows without ID or with a non-numeric fee are dropped and counted via skippedInvalid —
 * recording 0 for a malformed fee would silently corrupt data. Renewal labels use the same mapping
 * as the contracts feed; unknown labels set no renewalType (we never invent a value).
 */
export class MaintenancePayloadMapper {
  static toSyncRecords(rows: Record<string, unknown>[]): MaintenancePayloadOutput {
    const byId = new Map<string, SyncMaintenanceRecord>()
    let skippedInvalid = 0

    for (const row of rows) {
      if (String(row.DatePeriod ?? '') !== 'CURRENT') {
        continue
      }

      const cmsCaseId = String(row.ID ?? '')
      const fee = this.parseFee(row.Fee)
      if (!cmsCaseId || fee === null) {
        skippedInvalid += 1
        continue
      }

      const existing = byId.get(cmsCaseId)
      if (existing) {
        existing.totalValue += fee
        continue
      }

      const contractId = String(row.ContractID ?? '')
      const renewalType = RENEWAL_TYPE_BY_SAP_LABEL[String(row.RenewalType ?? '')]
      byId.set(cmsCaseId, {
        cmsCaseId,
        contractNumber: !contractId || contractId === NO_CONTRACT_SENTINEL ? null : contractId,
        customerSapId: String(row.CustomerId ?? ''),
        customerName: String(row.CustomerName ?? ''),
        endDate: row.MaintenanceEnd ? String(row.MaintenanceEnd) : null,
        totalValue: fee,
        currency: String(row.Currency ?? ''),
        ...(renewalType ? { renewalType } : {}),
        supportModel: String(row.SupportModel ?? ''),
        upcomingMaintenanceEnd: row.UpcomingOrderMaintenanceEnd ? String(row.UpcomingOrderMaintenanceEnd) : null,
        upcomingMaintenanceFee: this.parseFee(row.UpcomingOrderMaintenanceFee)
      })
    }

    return { maintenances: [...byId.values()], skippedInvalid }
  }

  // Acepta number y string numérico (IEEE754Compatible serializa enteros grandes como string);
  // cualquier otra cosa invalida el campo — mismo criterio que el mapper de consumo.
  private static parseFee(value: unknown): Nullable<number> {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null
    }
    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value)
      return Number.isFinite(parsed) ? parsed : null
    }
    return null
  }
}
