import {
  ContractTypeEnum,
  ContractStatusEnum,
  ContractSourceEnum,
  BillingFrequencyEnum,
  RenewalTypeEnum
} from './contract-enums'

export interface UpdateContractDto {
  contractType?: ContractTypeEnum
  contractNumber?: string | null
  customerId?: string
  customerName?: string
  cmsCaseId?: string
  businessModel?: string
  subSolutionAreas?: string[]
  nbrOfContracts?: number
  isFavorite?: boolean
  status?: ContractStatusEnum
  source?: ContractSourceEnum
  startDate?: string | null
  endDate?: string | null
  totalValue?: number
  currency?: string
  billingFrequency?: BillingFrequencyEnum
  renewalType?: RenewalTypeEnum
  notes?: string
}
