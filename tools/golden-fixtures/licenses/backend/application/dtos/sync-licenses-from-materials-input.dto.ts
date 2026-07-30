import { Nullable } from '../../../../../shared/domain/types'

/**
 * Una licencia ME_SAP derivada de un material de contrato de SAP (spec 33).
 * El cliente se resuelve por el contrato (contractNumber → Contract), NUNCA por el
 * CustomerId del material (que es el sold-to, no el customerId de me.sap).
 */
export interface SyncLicenseMaterial {
  contractNumber: string
  materialId: string
  metricName: string
  subSolutionAreaName: string
  metric: string
  licensedUnits: number
  pricePerUnit: number
  // Tasa anual autoritativa de SAP (AnnualFee), exacta (spec 42); 0 si el material no trae importe.
  annualValue: number
  contractEndDate: Nullable<string>
}

export interface SyncLicensesFromMaterialsInput {
  materials: SyncLicenseMaterial[]
  /** fecha del run (ISO): marca lastSeenInSyncAt de las licencias vistas */
  seenAt: string
}

export interface SyncMaterialFailure {
  contractNumber: string
  materialId: string
  reason: string
}

export interface SyncLicensesFromMaterialsOutput {
  records: number
  skipped: number
  failures: SyncMaterialFailure[]
}
