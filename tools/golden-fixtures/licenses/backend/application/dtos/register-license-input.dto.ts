export interface RegisterLicenseInput {
  id: string
  contractId: string
  customerId: string
  customerName: string
  contractNumber: string
  contractEndDate?: string | null
  metricId?: string
  metricName: string
  subSolutionAreaName?: string
  metric: string
  licensedUnits: number
  pricePerUnit: number
  status?: string
}
