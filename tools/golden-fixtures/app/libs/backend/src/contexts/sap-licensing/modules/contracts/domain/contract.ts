import { AggregateRoot } from '../../../../shared/domain/aggregate-root'
import { Nullable, Undefinable } from '../../../../shared/domain/types'
import { ContractId } from '../../../../shared/domain/value-objects/contracts/contract-id.vo'
import { CustomerId } from '../../../../shared/domain/value-objects/customers/customer-id.vo'
import { ContractDate } from '../../../shared/domain/value-objects/contract-date.vo'
import { ContractNumber } from '../../../shared/domain/value-objects/contract-number.vo'
import { CustomerName } from '../../../shared/domain/value-objects/customer-name.vo'
import { Period } from '../../../shared/domain/value-objects/period.vo'
import { SyncTimestamp } from '../../../shared/domain/value-objects/sync-timestamp.vo'
import {
  ContractAggregateProps,
  ContractPrimitiveProps,
  ContractUniquenessUpdateProps,
  ContractUpdateProps,
  RegisterContractProps
} from './contract-types'
import { BillingFrequency } from './value-objects/billing-frequency.vo'
import { BusinessModel } from './value-objects/business-model.vo'
import { CmsCaseId } from './value-objects/cms-case-id.vo'
import { ContractCurrency } from './value-objects/contract-currency.vo'
import { ContractLifecycleStatus } from './value-objects/contract-lifecycle-status.vo'
import { ContractNotes } from './value-objects/contract-notes.vo'
import { ContractOrigin } from './value-objects/contract-origin.vo'
import { ContractSource } from './value-objects/contract-source.vo'
import { ContractStatus } from './value-objects/contract-status.vo'
import { ContractType } from './value-objects/contract-type.vo'
import { ContractValue } from './value-objects/contract-value.vo'
import { IsFavorite } from './value-objects/is-favorite.vo'
import { NumberOfContracts } from './value-objects/number-of-contracts.vo'
import { RenewalType } from './value-objects/renewal-type.vo'
import { SubSolutionAreas } from './value-objects/sub-solution-areas.vo'
import { SupportModel } from './value-objects/support-model.vo'

export class Contract extends AggregateRoot {
  private constructor(
    private readonly _id: ContractId,
    private _contractType: ContractType,
    private _contractNumber: Nullable<ContractNumber>,
    private _customerId: CustomerId,
    private _customerName: CustomerName,
    private _cmsCaseId: CmsCaseId,
    private _businessModel: BusinessModel,
    private _subSolutionAreas: SubSolutionAreas,
    private _nbrOfContracts: NumberOfContracts,
    private _isFavorite: IsFavorite,
    private _status: ContractStatus,
    private _source: ContractSource,
    private _totalValue: ContractValue,
    private _currency: ContractCurrency,
    private _billingFrequency: BillingFrequency,
    private _renewalType: RenewalType,
    private _notes: ContractNotes,
    private _origin: ContractOrigin,
    private _lifecycleStatus: ContractLifecycleStatus,
    private _archivedAt: Nullable<SyncTimestamp>,
    private _lastSeenInSyncAt: Nullable<SyncTimestamp>,
    private _supportModel: SupportModel,
    private _upcomingMaintenanceEnd: Nullable<ContractDate>,
    private _upcomingMaintenanceFee: Nullable<ContractValue>,
    private _period: Period
  ) {
    super()
  }

  //#region ...Getters...
  get id(): ContractId {
    return this._id
  }
  get contractType(): ContractType {
    return this._contractType
  }
  get contractNumber(): Nullable<ContractNumber> {
    return this._contractNumber
  }
  get customerId(): CustomerId {
    return this._customerId
  }
  get customerName(): CustomerName {
    return this._customerName
  }
  get cmsCaseId(): CmsCaseId {
    return this._cmsCaseId
  }
  get businessModel(): BusinessModel {
    return this._businessModel
  }
  get subSolutionAreas(): SubSolutionAreas {
    return this._subSolutionAreas
  }
  get nbrOfContracts(): NumberOfContracts {
    return this._nbrOfContracts
  }
  get isFavorite(): IsFavorite {
    return this._isFavorite
  }
  get status(): ContractStatus {
    return this._status
  }
  get source(): ContractSource {
    return this._source
  }
  get totalValue(): ContractValue {
    return this._totalValue
  }
  get currency(): ContractCurrency {
    return this._currency
  }
  get billingFrequency(): BillingFrequency {
    return this._billingFrequency
  }
  get renewalType(): RenewalType {
    return this._renewalType
  }
  get notes(): ContractNotes {
    return this._notes
  }
  get origin(): ContractOrigin {
    return this._origin
  }
  get lifecycleStatus(): ContractLifecycleStatus {
    return this._lifecycleStatus
  }
  get archivedAt(): Nullable<SyncTimestamp> {
    return this._archivedAt
  }
  get lastSeenInSyncAt(): Nullable<SyncTimestamp> {
    return this._lastSeenInSyncAt
  }
  get supportModel(): SupportModel {
    return this._supportModel
  }
  get upcomingMaintenanceEnd(): Nullable<ContractDate> {
    return this._upcomingMaintenanceEnd
  }
  get upcomingMaintenanceFee(): Nullable<ContractValue> {
    return this._upcomingMaintenanceFee
  }
  get period(): Period {
    return this._period
  }
  //#endregion

  static create(props: ContractAggregateProps): Contract {
    return new Contract(
      props.id,
      props.contractType,
      props.contractNumber,
      props.customerId,
      props.customerName,
      props.cmsCaseId,
      props.businessModel,
      props.subSolutionAreas,
      props.nbrOfContracts,
      props.isFavorite,
      props.status,
      props.source,
      props.totalValue,
      props.currency,
      props.billingFrequency,
      props.renewalType,
      props.notes,
      ContractOrigin.create('MANUAL'),
      ContractLifecycleStatus.create('active'),
      null,
      null,
      props.supportModel,
      props.upcomingMaintenanceEnd,
      props.upcomingMaintenanceFee,
      props.period
    )
  }

  static register(props: RegisterContractProps): Contract {
    return Contract.create({
      id: ContractId.create(props.id),
      contractType: ContractType.create(props.contractType),
      contractNumber: props.contractNumber === null ? null : ContractNumber.create(props.contractNumber),
      customerId: CustomerId.create(props.customerId),
      customerName: CustomerName.create(props.customerName),
      cmsCaseId: CmsCaseId.create(props.cmsCaseId ?? ''),
      businessModel: BusinessModel.create(props.businessModel ?? ''),
      subSolutionAreas: SubSolutionAreas.create(props.subSolutionAreas ?? []),
      nbrOfContracts: NumberOfContracts.create(props.nbrOfContracts ?? 1),
      isFavorite: IsFavorite.create(props.isFavorite ?? false),
      status: ContractStatus.create(props.status ?? 'active'),
      source: ContractSource.create(props.source ?? 'AVVALE_SOLD'),
      totalValue: ContractValue.create(props.totalValue ?? 0),
      currency: ContractCurrency.create(props.currency ?? 'EUR'),
      billingFrequency: BillingFrequency.create(props.billingFrequency ?? 'yearly'),
      renewalType: RenewalType.create(props.renewalType ?? 'manual'),
      notes: ContractNotes.create(props.notes ?? ''),
      supportModel: SupportModel.create(props.supportModel ?? ''),
      upcomingMaintenanceEnd: props.upcomingMaintenanceEnd
        ? ContractDate.create(new Date(props.upcomingMaintenanceEnd))
        : ContractDate.unset(),
      upcomingMaintenanceFee:
        props.upcomingMaintenanceFee === null ? null : ContractValue.create(props.upcomingMaintenanceFee),
      period: Period.create(
        props.startDate ? ContractDate.create(new Date(props.startDate)) : null,
        props.endDate ? ContractDate.create(new Date(props.endDate)) : null
      )
    })
  }

  static fromPrimitives(props: ContractPrimitiveProps): Contract {
    return new Contract(
      ContractId.create(props.id),
      ContractType.create(props.contractType),
      props.contractNumber === null ? null : ContractNumber.create(props.contractNumber),
      CustomerId.create(props.customerId),
      CustomerName.create(props.customerName),
      CmsCaseId.create(props.cmsCaseId),
      BusinessModel.create(props.businessModel),
      SubSolutionAreas.create(props.subSolutionAreas),
      NumberOfContracts.create(props.nbrOfContracts),
      IsFavorite.create(props.isFavorite),
      ContractStatus.create(props.status),
      ContractSource.create(props.source),
      ContractValue.create(props.totalValue),
      ContractCurrency.create(props.currency),
      BillingFrequency.create(props.billingFrequency),
      RenewalType.create(props.renewalType),
      ContractNotes.create(props.notes),
      props.origin ? ContractOrigin.create(props.origin) : ContractOrigin.create('MANUAL'),
      props.lifecycleStatus
        ? ContractLifecycleStatus.create(props.lifecycleStatus)
        : ContractLifecycleStatus.create('active'),
      props.archivedAt ? SyncTimestamp.fromISOString(props.archivedAt) : null,
      props.lastSeenInSyncAt ? SyncTimestamp.fromISOString(props.lastSeenInSyncAt) : null,
      SupportModel.create(props.supportModel ?? ''),
      props.upcomingMaintenanceEnd ? ContractDate.create(new Date(props.upcomingMaintenanceEnd)) : ContractDate.unset(),
      props.upcomingMaintenanceFee != null ? ContractValue.create(props.upcomingMaintenanceFee) : ContractValue.unset(),
      Period.create(
        props.startDate ? ContractDate.create(new Date(props.startDate)) : null,
        props.endDate ? ContractDate.create(new Date(props.endDate)) : null
      )
    )
  }

  toPrimitives(): ContractPrimitiveProps {
    return {
      id: this._id.value,
      contractType: this._contractType.value,
      contractNumber: this._contractNumber ? this._contractNumber.value : null,
      customerId: this._customerId.value,
      customerName: this._customerName.value,
      cmsCaseId: this._cmsCaseId.value,
      businessModel: this._businessModel.value,
      subSolutionAreas: [...this._subSolutionAreas.value],
      nbrOfContracts: this._nbrOfContracts.value,
      isFavorite: this._isFavorite.value,
      status: this._status.value,
      source: this._source.value,
      startDate: this._period.start ? this._period.start.toDateString() : null,
      endDate: this._period.end ? this._period.end.toDateString() : null,
      totalValue: this._totalValue.value,
      currency: this._currency.value,
      billingFrequency: this._billingFrequency.value,
      renewalType: this._renewalType.value,
      notes: this._notes.value,
      origin: this._origin.value,
      lifecycleStatus: this._lifecycleStatus.value,
      archivedAt: this._archivedAt?.toISOString() ?? null,
      lastSeenInSyncAt: this._lastSeenInSyncAt?.toISOString() ?? null,
      supportModel: this._supportModel.value,
      upcomingMaintenanceEnd: this._upcomingMaintenanceEnd ? this._upcomingMaintenanceEnd.toDateString() : null,
      upcomingMaintenanceFee: this._upcomingMaintenanceFee ? this._upcomingMaintenanceFee.value : null
    }
  }

  updateDetails(updates: ContractUpdateProps): void {
    if (updates.contractType !== undefined) {
      this._contractType = ContractType.create(updates.contractType)
    }
    if (updates.contractNumber !== undefined) {
      this._contractNumber = updates.contractNumber === null ? null : ContractNumber.create(updates.contractNumber)
    }
    if (updates.customerId !== undefined) {
      this._customerId = CustomerId.create(updates.customerId)
    }
    if (updates.customerName !== undefined) {
      this._customerName = CustomerName.create(updates.customerName)
    }
    if (updates.cmsCaseId !== undefined) {
      this._cmsCaseId = CmsCaseId.create(updates.cmsCaseId)
    }
    if (updates.businessModel !== undefined) {
      this._businessModel = BusinessModel.create(updates.businessModel)
    }
    if (updates.subSolutionAreas !== undefined) {
      this._subSolutionAreas = SubSolutionAreas.create(updates.subSolutionAreas)
    }
    if (updates.nbrOfContracts !== undefined) {
      this._nbrOfContracts = NumberOfContracts.create(updates.nbrOfContracts)
    }
    if (updates.isFavorite !== undefined) {
      this._isFavorite = IsFavorite.create(updates.isFavorite)
    }
    if (updates.status !== undefined) {
      this._status = ContractStatus.create(updates.status)
    }
    if (updates.source !== undefined) {
      this._source = ContractSource.create(updates.source)
    }
    if (updates.totalValue !== undefined) {
      this._totalValue = ContractValue.create(updates.totalValue)
    }
    if (updates.currency !== undefined) {
      this._currency = ContractCurrency.create(updates.currency)
    }
    if (updates.billingFrequency !== undefined) {
      this._billingFrequency = BillingFrequency.create(updates.billingFrequency)
    }
    if (updates.renewalType !== undefined) {
      this._renewalType = RenewalType.create(updates.renewalType)
    }
    if (updates.notes !== undefined) {
      this._notes = ContractNotes.create(updates.notes)
    }
    if (updates.startDate !== undefined || updates.endDate !== undefined) {
      const start =
        updates.startDate !== undefined
          ? updates.startDate
            ? ContractDate.create(new Date(updates.startDate))
            : null
          : this._period.start
      const end =
        updates.endDate !== undefined
          ? updates.endDate
            ? ContractDate.create(new Date(updates.endDate))
            : null
          : this._period.end
      this._period = Period.create(start, end)
    }
  }

  equals(other: AggregateRoot): boolean {
    if (!(other instanceof Contract)) {
      return false
    }
    return this._id.equals(other._id)
  }

  newContractNumberIfChanged(updates: ContractUniquenessUpdateProps): Undefinable<ContractNumber> {
    if (!updates.contractNumber) {
      return
    }

    const newContractNumber = ContractNumber.create(updates.contractNumber)

    if (this._contractNumber?.equals(newContractNumber)) {
      return
    }

    return newContractNumber
  }

  // @ai:begin domain-extra — métodos de negocio no derivables del schema
  // @ai:end
}
