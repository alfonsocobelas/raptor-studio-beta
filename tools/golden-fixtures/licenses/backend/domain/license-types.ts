import { Nullable } from '../../../../shared/domain/types'
import { ConsumptionSourceValue } from './consumption-source'
import { ContractId } from '../../../../shared/domain/value-objects/contracts/contract-id.vo'
import { CustomerId } from '../../../../shared/domain/value-objects/customers/customer-id.vo'
import { LicenseId } from '../../../../shared/domain/value-objects/licenses/license-id.vo'
import { ContractDate } from '../../../shared/domain/value-objects/contract-date.vo'
import { ContractNumber } from '../../../shared/domain/value-objects/contract-number.vo'
import { CustomerName } from '../../../shared/domain/value-objects/customer-name.vo'
import { HealthStatus } from './license-health'
import { LicensedUnits } from './value-objects/licensed-units.vo'
import { LicenseMetric } from './value-objects/license-metric.vo'
import { LicenseSource } from './value-objects/license-source.vo'
import { LicenseStatus } from './value-objects/license-status.vo'
import { MetricId } from './value-objects/metric-id.vo'
import { MetricName } from './value-objects/metric-name.vo'
import { PricePerUnit } from './value-objects/price-per-unit.vo'
import { SubSolutionAreaName } from './value-objects/sub-solution-area-name.vo'

export interface RegisterLicenseProps {
  id: string
  contractId: string
  customerId: string
  customerName: string
  contractNumber: string
  metricName: string
  metric: string
  licensedUnits: number
  pricePerUnit: number
  contractEndDate?: string | null
  metricId?: string
  subSolutionAreaName?: string
  status?: string
}

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
  source: LicenseSource
  materialId: string
}

// Snapshot de consumo denormalizado (spec 26): foto derivada del registro de consumo más reciente,
// recalculada por el repositorio (recomputeConsumptionSnapshot) en cada escritura de consumos.
// El dominio la transporta pero no la muta: no entra en LicenseUpdateProps.
// annualValue NO va aquí (spec 42): es precio autoritativo de SAP, no una métrica de consumo.
export interface ConsumptionSnapshotProps {
  currentUnits: number
  consumptionPct: number
  excessUnits: number
}

export interface LicensePrimitiveProps extends ConsumptionSnapshotProps {
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
  // Valor anual autoritativo (spec 42): AnnualFee de SAP (ME_SAP) o units×price (MANUAL). Campo propio,
  // fuera del snapshot de consumo; el sync lo fija (create/update) y el recompute de consumo no lo toca.
  annualValue: number
  status: string
  // Origen/identidad SAP (spec 33) — opcionales en entrada (defaults retrocompatibles), siempre en toPrimitives
  source?: string
  materialId?: string
  // Lifecycle gobernado por el sync (spec 33), eje distinto de status de negocio
  lifecycleStatus?: string
  archivedAt?: Nullable<string>
  lastSeenInSyncAt?: Nullable<string>
}

// source/materialId y el lifecycle los gobierna el sync (markSeenInSync/archive), nunca edición manual
export type LicenseUpdateProps = Partial<
  Omit<
    LicensePrimitiveProps,
    | 'id'
    | 'source'
    | 'materialId'
    | 'lifecycleStatus'
    | 'archivedAt'
    | 'lastSeenInSyncAt'
    | keyof ConsumptionSnapshotProps
  >
>

export interface ConsumptionRecord {
  id: string
  licenseId: string
  periodYear: number
  periodMonth: number
  units: number
  source: ConsumptionSourceValue
}

export interface LicenseWithConsumption extends LicensePrimitiveProps {
  solutionName: string
  currentUnits: number
  consumptionPct: number
  healthStatus: HealthStatus
  annualValue: number
  excessUnits: number
}
