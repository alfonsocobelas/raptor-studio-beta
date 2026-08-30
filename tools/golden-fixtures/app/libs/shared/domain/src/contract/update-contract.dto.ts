import { ContractTypeEnum, ContractSourceEnum, BillingFrequencyEnum, RenewalTypeEnum } from './contract-enums'

export interface UpdateContractDto {
  contractType?: ContractTypeEnum
  contractNumber?: string | null
  customerId?: string
  cmsCaseId?: string
  businessModel?: string
  subSolutionAreas?: string[]
  nbrOfContracts?: number
  isFavorite?: boolean
  source?: ContractSourceEnum
  startDate?: string | null
  endDate?: string | null
  totalValue?: number
  currency?: string
  billingFrequency?: BillingFrequencyEnum
  renewalType?: RenewalTypeEnum
  notes?: string
  version: number
}
