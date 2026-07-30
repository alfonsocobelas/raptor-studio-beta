import { AggregateRoot } from '../../../../shared/domain/aggregate-root'
import { Nullable } from '../../../../shared/domain/types'
import { ContractId } from '../../../../shared/domain/value-objects/contracts/contract-id.vo'
import { CustomerId } from '../../../../shared/domain/value-objects/customers/customer-id.vo'
import { LicenseId } from '../../../../shared/domain/value-objects/licenses/license-id.vo'
import { ContractDate } from '../../../shared/domain/value-objects/contract-date.vo'
import { ContractNumber } from '../../../shared/domain/value-objects/contract-number.vo'
import { CustomerName } from '../../../shared/domain/value-objects/customer-name.vo'
import { computeAnnualValue, initialConsumptionSnapshot } from './consumption-snapshot'
import {
  ConsumptionSnapshotProps,
  LicenseAggregateProps,
  LicensePrimitiveProps,
  LicenseUpdateProps,
  RegisterLicenseProps
} from './license-types'
import { AnnualValue } from './value-objects/annual-value.vo'
import { LicensedUnits } from './value-objects/licensed-units.vo'
import { LicenseMetric } from './value-objects/license-metric.vo'
import { LicenseLifecycleStatus } from './value-objects/license-lifecycle-status.vo'
import { LicenseSource } from './value-objects/license-source.vo'
import { LicenseStatus } from './value-objects/license-status.vo'
import { LicenseError } from './license-errors'
import { SyncTimestamp } from '../../../shared/domain/value-objects/sync-timestamp.vo'
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
    // Valor anual autoritativo (spec 42): AnnualFee de SAP o units×price (manual). Precio, no consumo.
    private _annualValue: AnnualValue,
    private _status: LicenseStatus,
    // Origen SAP (spec 33): ME_SAP las gobierna el sync, MANUAL las gestiona el KAM.
    private readonly _source: LicenseSource,
    // Clave natural de las ME_SAP (contractNumber, materialId); opaco, vacío para MANUAL.
    private readonly _materialId: string,
    // Lifecycle SAP (spec 33): eje separado del status de negocio.
    private _lifecycleStatus: LicenseLifecycleStatus,
    private _archivedAt: Nullable<SyncTimestamp>,
    private _lastSeenInSyncAt: Nullable<SyncTimestamp>,
    // Foto derivada de solo lectura (sin VOs: no encapsula reglas — las recalcula el repositorio).
    private readonly _snapshot: ConsumptionSnapshotProps
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
  get metricName(): MetricName {
    return this._metricName
  }
  get licensedUnits(): LicensedUnits {
    return this._licensedUnits
  }
  get pricePerUnit(): PricePerUnit {
    return this._pricePerUnit
  }
  get annualValue(): AnnualValue {
    return this._annualValue
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
  get lastSeenInSyncAt(): Nullable<SyncTimestamp> {
    return this._lastSeenInSyncAt
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
      // Alta (manual y default): valor anual = units × price (cuota anual por unidad).
      AnnualValue.create(computeAnnualValue(props.licensedUnits.value, props.pricePerUnit.value)),
      props.status,
      props.source,
      props.materialId,
      LicenseLifecycleStatus.active(),
      SyncTimestamp.never(),
      SyncTimestamp.never(),
      // Licencia recién registrada: sin consumos todavía.
      initialConsumptionSnapshot(props.licensedUnits.value)
    )
  }

  static register(props: RegisterLicenseProps): License {
    return License.create({
      id: LicenseId.create(props.id),
      contractId: ContractId.create(props.contractId),
      customerId: CustomerId.create(props.customerId),
      customerName: CustomerName.create(props.customerName),
      contractNumber: ContractNumber.create(props.contractNumber),
      contractEndDate: props.contractEndDate ? ContractDate.create(new Date(props.contractEndDate)) : null,
      metricId: MetricId.create(props.metricId ?? ''),
      metricName: MetricName.create(props.metricName),
      subSolutionAreaName: SubSolutionAreaName.create(props.subSolutionAreaName ?? ''),
      metric: LicenseMetric.create(props.metric),
      licensedUnits: LicensedUnits.create(props.licensedUnits),
      pricePerUnit: PricePerUnit.create(props.pricePerUnit),
      status: LicenseStatus.create(props.status ?? 'active'),
      source: LicenseSource.manual(),
      materialId: ''
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
      // Valor anual autoritativo persistido (spec 42): SAP AnnualFee (ME_SAP) o units×price (manual).
      AnnualValue.create(props.annualValue),
      LicenseStatus.create(props.status),
      props.source ? LicenseSource.create(props.source) : LicenseSource.manual(),
      props.materialId ?? '',
      props.lifecycleStatus ? LicenseLifecycleStatus.create(props.lifecycleStatus) : LicenseLifecycleStatus.active(),
      props.archivedAt ? SyncTimestamp.fromISOString(props.archivedAt) : null,
      props.lastSeenInSyncAt ? SyncTimestamp.fromISOString(props.lastSeenInSyncAt) : null,
      // El snapshot de consumo guardado se transporta tal cual: lo recalcula el repositorio, no el dominio.
      {
        currentUnits: props.currentUnits,
        consumptionPct: props.consumptionPct,
        excessUnits: props.excessUnits
      }
    )
  }

  toPrimitives(): LicensePrimitiveProps {
    return {
      id: this._id.value,
      contractId: this._contractId.value,
      customerId: this._customerId.value,
      customerName: this._customerName.value,
      contractNumber: this._contractNumber.value,
      contractEndDate: this._contractEndDate ? License.toDateString(this._contractEndDate) : null,
      metricId: this._metricId.value,
      metricName: this._metricName.value,
      subSolutionAreaName: this._subSolutionAreaName.value,
      metric: this._metric.value,
      licensedUnits: this._licensedUnits.value,
      pricePerUnit: this._pricePerUnit.value,
      annualValue: this._annualValue.value,
      status: this._status.value,
      source: this._source.value,
      materialId: this._materialId,
      lifecycleStatus: this._lifecycleStatus.value,
      archivedAt: this._archivedAt?.toISOString() ?? null,
      lastSeenInSyncAt: this._lastSeenInSyncAt?.toISOString() ?? null,
      currentUnits: this._snapshot.currentUnits,
      consumptionPct: this._snapshot.consumptionPct,
      excessUnits: this._snapshot.excessUnits
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
    if ('contractEndDate' in updates) {
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
    // Valor anual autoritativo del sync (spec 42); guard !== undefined porque 0 es válido.
    if (updates.annualValue !== undefined) {
      this._annualValue = AnnualValue.create(updates.annualValue)
    }
    if (updates.status !== undefined) {
      this._status = LicenseStatus.create(updates.status)
    }
  }

  /** Marca presencia en un run de sync; si estaba archivada, reaparecer en SAP la reactiva. */
  markSeenInSync(seenAt: Date): void {
    this._lastSeenInSyncAt = SyncTimestamp.create(seenAt)

    if (this._lifecycleStatus.isArchived()) {
      this._lifecycleStatus = LicenseLifecycleStatus.active()
      this._archivedAt = SyncTimestamp.never()
    }
  }

  /**
   * Archiva por ausencia del material en los feeds de SAP. Invariantes: solo las ME_SAP vistas
   * alguna vez en SAP son archivables (una MANUAL no la gobierna el sync); re-archivar es no-op.
   */
  archive(at: Date): void {
    if (this._lifecycleStatus.isArchived()) {
      return
    }
    if (this._source.isManual()) {
      throw new LicenseError('Cannot archive a MANUAL license')
    }
    if (this._lastSeenInSyncAt === null) {
      throw new LicenseError('Cannot archive a license never seen in SAP')
    }
    this._lifecycleStatus = LicenseLifecycleStatus.archived()
    this._archivedAt = SyncTimestamp.create(at)
  }

  equals(other: AggregateRoot): boolean {
    if (!(other instanceof License)) {
      return false
    }
    return this._id.equals(other._id)
  }

  private static toDateString(date: ContractDate): string {
    return date.value.toISOString().slice(0, 10)
  }
}
