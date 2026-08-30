import { AggregateRoot } from '../../../../shared/domain/aggregate-root'
import { Nullable } from '../../../../shared/domain/types'
import { LicenseId } from '../../../../shared/domain/value-objects/licenses/license-id.vo'
import { ContractId } from '../../../../shared/domain/value-objects/contracts/contract-id.vo'
import { CustomerId } from '../../../../shared/domain/value-objects/customers/customer-id.vo'
import { ContractDate } from '../../../shared/domain/value-objects/contract-date.vo'
import { ContractNumber } from '../../../shared/domain/value-objects/contract-number.vo'
import { CustomerName } from '../../../shared/domain/value-objects/customer-name.vo'
import { SyncTimestamp } from '../../../shared/domain/value-objects/sync-timestamp.vo'
import { LicenseAggregateProps, LicensePrimitiveProps, LicenseUpdateProps, RegisterLicenseProps } from './license-types'
import { AnnualValue } from './value-objects/annual-value.vo'
import { LicenseLifecycleStatus } from './value-objects/license-lifecycle-status.vo'
import { LicenseMetric } from './value-objects/license-metric.vo'
import { LicenseSource } from './value-objects/license-source.vo'
import { LicenseStatus } from './value-objects/license-status.vo'
import { LicensedUnits } from './value-objects/licensed-units.vo'
import { MetricId } from './value-objects/metric-id.vo'
import { MetricName } from './value-objects/metric-name.vo'
import { PricePerUnit } from './value-objects/price-per-unit.vo'
import { SubSolutionAreaName } from './value-objects/sub-solution-area-name.vo'

export class License extends AggregateRoot {
  private constructor(
    private readonly _id: LicenseId,
    private _contractId: ContractId,
    private _customerId: CustomerId,
    private _customerName: CustomerName,
    private _contractNumber: ContractNumber,
    private _contractEndDate: Nullable<ContractDate>,
    private _metricId: MetricId,
    private _metricName: MetricName,
    private _subSolutionAreaName: SubSolutionAreaName,
    private _metric: LicenseMetric,
    private _licensedUnits: LicensedUnits,
    private _pricePerUnit: PricePerUnit,
    private _status: LicenseStatus,
    private _source: LicenseSource,
    private _materialId: string,
    private _lifecycleStatus: LicenseLifecycleStatus,
    private _archivedAt: Nullable<SyncTimestamp>,
    private _lastSeenInSyncAt: Nullable<SyncTimestamp>,
    private _currentUnits: number,
    private _consumptionPct: number,
    private _excessUnits: number,
    private _annualValue: AnnualValue,
    private readonly _version: number
  ) {
    super()
  }

  //#region ...Getters...
  get id(): LicenseId {
    return this._id
  }
  get contractId(): ContractId {
    return this._contractId
  }
  get customerId(): CustomerId {
    return this._customerId
  }
  get customerName(): CustomerName {
    return this._customerName
  }
  get contractNumber(): ContractNumber {
    return this._contractNumber
  }
  get contractEndDate(): Nullable<ContractDate> {
    return this._contractEndDate
  }
  get metricId(): MetricId {
    return this._metricId
  }
  get metricName(): MetricName {
    return this._metricName
  }
  get subSolutionAreaName(): SubSolutionAreaName {
    return this._subSolutionAreaName
  }
  get metric(): LicenseMetric {
    return this._metric
  }
  get licensedUnits(): LicensedUnits {
    return this._licensedUnits
  }
  get pricePerUnit(): PricePerUnit {
    return this._pricePerUnit
  }
  get status(): LicenseStatus {
    return this._status
  }
  get source(): LicenseSource {
    return this._source
  }
  get materialId(): string {
    return this._materialId
  }
  get lifecycleStatus(): LicenseLifecycleStatus {
    return this._lifecycleStatus
  }
  get archivedAt(): Nullable<SyncTimestamp> {
    return this._archivedAt
  }
  get lastSeenInSyncAt(): Nullable<SyncTimestamp> {
    return this._lastSeenInSyncAt
  }
  get currentUnits(): number {
    return this._currentUnits
  }
  get consumptionPct(): number {
    return this._consumptionPct
  }
  get excessUnits(): number {
    return this._excessUnits
  }
  get annualValue(): AnnualValue {
    return this._annualValue
  }
  get version(): number {
    return this._version
  }
  //#endregion

  static create(props: LicenseAggregateProps): License {
    return new License(
      props.id,
      props.contractId,
      props.customerId,
      props.customerName,
      props.contractNumber,
      props.contractEndDate,
      props.metricId,
      props.metricName,
      props.subSolutionAreaName,
      props.metric,
      props.licensedUnits,
      props.pricePerUnit,
      props.status,
      LicenseSource.create('MANUAL'),
      props.materialId,
      LicenseLifecycleStatus.create('active'),
      null,
      null,
      props.currentUnits,
      props.consumptionPct,
      props.excessUnits,
      props.annualValue,
      1
    )
  }

  static register(props: RegisterLicenseProps): License {
    return License.create({
      id: LicenseId.create(props.id),
      contractId: ContractId.create(props.contractId ?? ''),
      customerId: CustomerId.create(props.customerId ?? ''),
      customerName: CustomerName.create(props.customerName),
      contractNumber: ContractNumber.create(props.contractNumber ?? ''),
      contractEndDate: props.contractEndDate ? ContractDate.create(new Date(props.contractEndDate)) : null,
      metricId: MetricId.create(props.metricId ?? ''),
      metricName: MetricName.create(props.metricName ?? ''),
      subSolutionAreaName: SubSolutionAreaName.create(props.subSolutionAreaName ?? ''),
      metric: LicenseMetric.create(props.metric ?? ''),
      licensedUnits: LicensedUnits.create(props.licensedUnits ?? 0),
      pricePerUnit: PricePerUnit.create(props.pricePerUnit ?? 0),
      status: LicenseStatus.create(props.status ?? 'active'),
      materialId: props.materialId ?? '',
      currentUnits: props.currentUnits ?? 0,
      consumptionPct: props.consumptionPct ?? 0,
      excessUnits: props.excessUnits ?? 0,
      annualValue: AnnualValue.create(props.annualValue ?? 0)
    })
  }

  static fromPrimitives(props: LicensePrimitiveProps): License {
    return new License(
      LicenseId.create(props.id),
      ContractId.create(props.contractId),
      CustomerId.create(props.customerId),
      CustomerName.create(props.customerName),
      ContractNumber.create(props.contractNumber),
      props.contractEndDate ? ContractDate.create(new Date(props.contractEndDate)) : null,
      MetricId.create(props.metricId),
      MetricName.create(props.metricName),
      SubSolutionAreaName.create(props.subSolutionAreaName),
      LicenseMetric.create(props.metric),
      LicensedUnits.create(props.licensedUnits),
      PricePerUnit.create(props.pricePerUnit),
      LicenseStatus.create(props.status),
      props.source ? LicenseSource.create(props.source) : LicenseSource.create('MANUAL'),
      props.materialId ?? '',
      props.lifecycleStatus
        ? LicenseLifecycleStatus.create(props.lifecycleStatus)
        : LicenseLifecycleStatus.create('active'),
      props.archivedAt ? SyncTimestamp.fromISOString(props.archivedAt) : null,
      props.lastSeenInSyncAt ? SyncTimestamp.fromISOString(props.lastSeenInSyncAt) : null,
      props.currentUnits,
      props.consumptionPct,
      props.excessUnits,
      AnnualValue.create(props.annualValue),
      props.version
    )
  }

  toPrimitives(): LicensePrimitiveProps {
    return {
      id: this._id.value,
      contractId: this._contractId.value,
      customerId: this._customerId.value,
      customerName: this._customerName.value,
      contractNumber: this._contractNumber.value,
      contractEndDate: this._contractEndDate ? this._contractEndDate.toDateString() : null,
      metricId: this._metricId.value,
      metricName: this._metricName.value,
      subSolutionAreaName: this._subSolutionAreaName.value,
      metric: this._metric.value,
      licensedUnits: this._licensedUnits.value,
      pricePerUnit: this._pricePerUnit.value,
      status: this._status.value,
      source: this._source.value,
      materialId: this._materialId,
      lifecycleStatus: this._lifecycleStatus.value,
      archivedAt: this._archivedAt?.toISOString() ?? null,
      lastSeenInSyncAt: this._lastSeenInSyncAt?.toISOString() ?? null,
      currentUnits: this._currentUnits,
      consumptionPct: this._consumptionPct,
      excessUnits: this._excessUnits,
      annualValue: this._annualValue.value,
      version: this._version
    }
  }

  updateDetails(updates: LicenseUpdateProps): void {
    if (updates.contractId !== undefined) {
      this._contractId = ContractId.create(updates.contractId)
    }
    if (updates.customerId !== undefined) {
      this._customerId = CustomerId.create(updates.customerId)
    }
    if (updates.customerName !== undefined) {
      this._customerName = CustomerName.create(updates.customerName)
    }
    if (updates.contractNumber !== undefined) {
      this._contractNumber = ContractNumber.create(updates.contractNumber)
    }
    if (updates.contractEndDate !== undefined) {
      this._contractEndDate = updates.contractEndDate ? ContractDate.create(new Date(updates.contractEndDate)) : null
    }
    if (updates.metricId !== undefined) {
      this._metricId = MetricId.create(updates.metricId)
    }
    if (updates.metricName !== undefined) {
      this._metricName = MetricName.create(updates.metricName)
    }
    if (updates.subSolutionAreaName !== undefined) {
      this._subSolutionAreaName = SubSolutionAreaName.create(updates.subSolutionAreaName)
    }
    if (updates.metric !== undefined) {
      this._metric = LicenseMetric.create(updates.metric)
    }
    if (updates.licensedUnits !== undefined) {
      this._licensedUnits = LicensedUnits.create(updates.licensedUnits)
    }
    if (updates.pricePerUnit !== undefined) {
      this._pricePerUnit = PricePerUnit.create(updates.pricePerUnit)
    }
    if (updates.status !== undefined) {
      this._status = LicenseStatus.create(updates.status)
    }
    if (updates.currentUnits !== undefined) {
      this._currentUnits = updates.currentUnits
    }
    if (updates.consumptionPct !== undefined) {
      this._consumptionPct = updates.consumptionPct
    }
    if (updates.excessUnits !== undefined) {
      this._excessUnits = updates.excessUnits
    }
    if (updates.annualValue !== undefined) {
      this._annualValue = AnnualValue.create(updates.annualValue)
    }
  }

  equals(other: AggregateRoot): boolean {
    if (!(other instanceof License)) {
      return false
    }
    return this._id.equals(other._id)
  }

  // @ai:begin domain-extra — métodos de negocio no derivables del schema
  // @ai:end
}
