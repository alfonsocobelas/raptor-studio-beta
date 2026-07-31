export type ContractTypeEnum = 'cloud' | 'onprem' | 'mixed' | 'maintenance'

export type ContractStatusEnum = 'active' | 'expiring' | 'expired' | 'terminated'

export type ContractSourceEnum = 'AVVALE_SOLD' | 'CUSTOMER_OWNED'

export type BillingFrequencyEnum = 'monthly' | 'quarterly' | 'semiannual' | 'yearly'

export type RenewalTypeEnum = 'auto' | 'manual' | 'none'

export interface ContractDto {
  id: string
  contractType: ContractTypeEnum
  contractNumber: string | null
  customerId: string
  customerName: string
  cmsCaseId: string
  businessModel: string
  subSolutionAreas: string[]
  nbrOfContracts: number
  isFavorite: boolean
  status: ContractStatusEnum
  source: ContractSourceEnum
  startDate: string | null
  endDate: string | null
  totalValue: number
  currency: string
  billingFrequency: BillingFrequencyEnum
  renewalType: RenewalTypeEnum
  notes: string
  origin: string
  lifecycleStatus: string
  archivedAt: string | null
  lastSeenInSyncAt: string | null
  supportModel: string
  upcomingMaintenanceEnd: string | null
  upcomingMaintenanceFee: number | null
}
