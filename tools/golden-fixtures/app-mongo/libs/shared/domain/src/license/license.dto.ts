export interface LicenseWithConsumptionDto {
  id: string
  contractId: string
  customerId: string
  customerName: string
  contractNumber: string
  contractEndDate: string | null
  metricId: string
  metricName: string
  subSolutionAreaName: string
  metric: string
  licensedUnits: number
  pricePerUnit: number
  status: string
  source: string
  materialId: string
  lifecycleStatus: string
  archivedAt: string | null
  lastSeenInSyncAt: string | null
  currentUnits: number
  consumptionPct: number
  excessUnits: number
  annualValue: number
  version: number
}
