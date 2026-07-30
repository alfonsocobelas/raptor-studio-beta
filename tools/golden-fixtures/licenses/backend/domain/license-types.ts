import { Nullable } from '../../../../shared/domain/types'
import { LicenseId } from '../../../../shared/domain/value-objects/licenses/license-id.vo'
import { ContractId } from '../../../../shared/domain/value-objects/contracts/contract-id.vo'
import { CustomerId } from '../../../../shared/domain/value-objects/customers/customer-id.vo'
import { ContractDate } from '../../../shared/domain/value-objects/contract-date.vo'
import { ContractNumber } from '../../../shared/domain/value-objects/contract-number.vo'
import { CustomerName } from '../../../shared/domain/value-objects/customer-name.vo'
import { AnnualValue } from './value-objects/annual-value.vo'
import { LicenseMetric } from './value-objects/license-metric.vo'
import { LicenseStatus } from './value-objects/license-status.vo'
import { LicensedUnits } from './value-objects/licensed-units.vo'
import { MetricId } from './value-objects/metric-id.vo'
import { MetricName } from './value-objects/metric-name.vo'
import { PricePerUnit } from './value-objects/price-per-unit.vo'
import { SubSolutionAreaName } from './value-objects/sub-solution-area-name.vo'

export interface LicenseAggregateProps {
  id: LicenseId
  contractId: ContractId
  customerId: CustomerId
  customerName: CustomerName
  contractNumber: ContractNumber
  contractEndDate: Nullable<ContractDate>
  metricId: MetricId
  metricName: MetricName
  subSolutionAreaName: SubSolutionAreaName
  metric: LicenseMetric
  licensedUnits: LicensedUnits
  pricePerUnit: PricePerUnit
  status: LicenseStatus
  materialId: string
  currentUnits: number
  consumptionPct: number
  excessUnits: number
  annualValue: AnnualValue
}

export interface LicensePrimitiveProps {
  id: string
  contractId: string
  customerId: string
  customerName: string
  contractNumber: string
  contractEndDate: Nullable<string>
  metricId: string
  metricName: string
  subSolutionAreaName: string
  metric: string
  licensedUnits: number
  pricePerUnit: number
  status: string
  source?: string
  materialId?: string
  lifecycleStatus?: string
  archivedAt?: Nullable<string>
  lastSeenInSyncAt?: Nullable<string>
  currentUnits: number
  consumptionPct: number
  excessUnits: number
  annualValue: number
}

export type LicenseUpdateProps = Partial<
  Omit<LicensePrimitiveProps, 'id' | 'source' | 'materialId' | 'lifecycleStatus' | 'archivedAt' | 'lastSeenInSyncAt'>
>

export interface RegisterLicenseProps {
  id: string
  contractId?: string
  customerId?: string
  customerName: string
  contractNumber?: string
  contractEndDate?: string | null
  metricId?: string
  metricName?: string
  subSolutionAreaName?: string
  metric?: string
  licensedUnits?: number
  pricePerUnit?: number
  status?: string
  materialId?: string
  currentUnits?: number
  consumptionPct?: number
  excessUnits?: number
  annualValue?: number
}
