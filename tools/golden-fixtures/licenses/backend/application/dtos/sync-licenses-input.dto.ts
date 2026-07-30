export interface SyncConsumptionRecord {
  customerSapId: string
  metricId: string
  units: number
  periodYear: number
  periodMonth: number
}

export interface SyncLicensesInput {
  consumption: SyncConsumptionRecord[]
}

export interface SyncConsumptionFailure {
  customerSapId: string
  metricId: string
  periodYear: number
  periodMonth: number
  reason: string
}

export interface SyncLicensesOutput {
  records: number
  skipped: number
  failures: SyncConsumptionFailure[]
}
