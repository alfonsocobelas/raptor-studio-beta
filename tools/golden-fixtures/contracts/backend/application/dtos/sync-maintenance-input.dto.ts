import { Nullable } from '../../../../../shared/domain/types'

// Registro agregado de ISMaintenances (spec 44): un contrato de mantenimiento por `ID` de SAP.
// La clave de upsert/archivado es cmsCaseId (caso+pedido), no contractNumber (36% del feed sin él).
export interface SyncMaintenanceRecord {
  cmsCaseId: string
  contractNumber: Nullable<string>
  customerSapId: string
  customerName: string
  endDate: Nullable<string>
  totalValue: number
  currency: string
  renewalType?: string
  supportModel: string
  upcomingMaintenanceEnd: Nullable<string>
  upcomingMaintenanceFee: Nullable<number>
}

export interface SyncMaintenanceInput {
  maintenances: SyncMaintenanceRecord[]
  seenAt: string
}

export interface SyncMaintenanceFailure {
  cmsCaseId: string
  reason: string
}

export interface SyncMaintenanceOutput {
  records: number
  skipped: number
  failures: SyncMaintenanceFailure[]
}
