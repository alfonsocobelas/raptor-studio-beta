import { Nullable } from '../../../../shared/domain/types'
import { ContractId } from '../../../../shared/domain/value-objects/contracts/contract-id.vo'
import { CustomerId } from '../../../../shared/domain/value-objects/customers/customer-id.vo'
import { ContractDate } from '../../../shared/domain/value-objects/contract-date.vo'
import { ContractNumber } from '../../../shared/domain/value-objects/contract-number.vo'
import { CustomerName } from '../../../shared/domain/value-objects/customer-name.vo'
import { Period } from '../../../shared/domain/value-objects/period.vo'
import { BillingFrequency } from './value-objects/billing-frequency.vo'
import { BusinessModel } from './value-objects/business-model.vo'
import { CmsCaseId } from './value-objects/cms-case-id.vo'
import { ContractCurrency } from './value-objects/contract-currency.vo'
import { ContractNotes } from './value-objects/contract-notes.vo'
import { ContractSource } from './value-objects/contract-source.vo'
import { ContractStatus } from './value-objects/contract-status.vo'
import { ContractType } from './value-objects/contract-type.vo'
import { ContractValue } from './value-objects/contract-value.vo'
import { IsFavorite } from './value-objects/is-favorite.vo'
import { NumberOfContracts } from './value-objects/number-of-contracts.vo'
import { RenewalType } from './value-objects/renewal-type.vo'
import { SubSolutionAreas } from './value-objects/sub-solution-areas.vo'
import { SupportModel } from './value-objects/support-model.vo'

export interface ContractAggregateProps {
  id: ContractId
  contractType: ContractType
  contractNumber: Nullable<ContractNumber>
  customerId: CustomerId
  customerName: CustomerName
  cmsCaseId: CmsCaseId
  businessModel: BusinessModel
  subSolutionAreas: SubSolutionAreas
  nbrOfContracts: NumberOfContracts
  isFavorite: IsFavorite
  source: ContractSource
  totalValue: ContractValue
  currency: ContractCurrency
  billingFrequency: BillingFrequency
  renewalType: RenewalType
  notes: ContractNotes
  supportModel: SupportModel
  upcomingMaintenanceEnd: Nullable<ContractDate>
  upcomingMaintenanceFee: Nullable<ContractValue>
  period: Period
}

export interface ContractPrimitiveProps {
  id: string
  contractType: string
  contractNumber: Nullable<string>
  customerId: string
  customerName: string
  cmsCaseId: string
  businessModel: string
  subSolutionAreas: string[]
  nbrOfContracts: number
  isFavorite: boolean
  status: string
  source: string
  startDate: Nullable<string>
  endDate: Nullable<string>
  totalValue: number
  currency: string
  billingFrequency: string
  renewalType: string
  notes: string
  origin?: string
  lifecycleStatus?: string
  archivedAt?: Nullable<string>
  lastSeenInSyncAt?: Nullable<string>
  supportModel?: string
  upcomingMaintenanceEnd?: Nullable<string>
  upcomingMaintenanceFee?: Nullable<number>
  version: number
}

export type ContractUpdateProps = Partial<
  Omit<
    ContractPrimitiveProps,
    | 'id'
    | 'status'
    | 'origin'
    | 'lifecycleStatus'
    | 'archivedAt'
    | 'lastSeenInSyncAt'
    | 'supportModel'
    | 'upcomingMaintenanceEnd'
    | 'upcomingMaintenanceFee'
  >
>

export type ContractUniquenessUpdateProps = Pick<ContractUpdateProps, 'contractNumber'>

export interface RegisterContractProps {
  id: string
  contractType: string
  contractNumber: Nullable<string>
  customerId: string
  customerName: string
  cmsCaseId?: string
  businessModel?: string
  subSolutionAreas?: string[]
  nbrOfContracts?: number
  isFavorite?: boolean
  source?: string
  startDate: Nullable<string>
  endDate?: string | null
  totalValue?: number
  currency?: string
  billingFrequency?: string
  renewalType?: string
  notes?: string
  supportModel?: string
  upcomingMaintenanceEnd?: string | null
  upcomingMaintenanceFee?: number | null
}
