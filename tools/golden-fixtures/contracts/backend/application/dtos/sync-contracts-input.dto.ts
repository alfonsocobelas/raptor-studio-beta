import { Nullable } from '../../../../../shared/domain/types'

export interface SyncContractRecord {
  contractType: string
  contractNumber: string
  customerSapId: string
  customerName: string
  cmsCaseId: string
  businessModel: string
  subSolutionAreas: string[]
  nbrOfContracts: number
  isFavorite: boolean
  startDate: string
  endDate: Nullable<string>
  // Desde UpcomingCloudRenewals (spec 44); ausente = el contrato conserva su valor actual
  renewalType?: string
  // Desde ContractsRedesign (spec 45); ausentes = el contrato conserva sus valores actuales
  billingFrequency?: string
  currency?: string
}

export interface SyncContractsInput {
  contracts: SyncContractRecord[]
  seenAt: string
}

export interface SyncContractFailure {
  contractNumber: string
  reason: string
}

export interface SyncContractsOutput {
  records: number
  skipped: number
  failures: SyncContractFailure[]
}
