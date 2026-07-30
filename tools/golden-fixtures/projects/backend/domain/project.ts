import { AggregateRoot } from '../../../../shared/domain/aggregate-root'
import { Nullable, Undefinable } from '../../../../shared/domain/types'
import { CustomerId } from '../../../../shared/domain/value-objects/customers/customer-id.vo'
import { ProjectId } from '../../../../shared/domain/value-objects/projects/project-id.vo'
import { SyncTimestamp } from '../../../shared/domain/value-objects/sync-timestamp.vo'
import { ContractDate } from '../../../shared/domain/value-objects/contract-date.vo'
import { CustomerName } from '../../../shared/domain/value-objects/customer-name.vo'
import { Period } from '../../../shared/domain/value-objects/period.vo'
import { ProjectError } from './project-errors'
import {
  ProjectAggregateProps,
  ProjectPrimitiveProps,
  ProjectSapSyncProps,
  ProjectUniquenessUpdateProps,
  ProjectUpdateProps,
  RegisterProjectProps,
  RegisterSapProjectProps
} from './project-types'
import { ProjectDescription } from './value-objects/project-description.vo'
import { ProjectImplementer } from './value-objects/project-implementer.vo'
import { ProjectLifecycleStatus } from './value-objects/project-lifecycle-status.vo'
import { ProjectName } from './value-objects/project-name.vo'
import { ProjectOrigin } from './value-objects/project-origin.vo'
import { ProjectStatus } from './value-objects/project-status.vo'
import { SapProjectId } from './value-objects/sap-project-id.vo'

// Campos que el sync gobierna en un proyecto ME_SAP (spec 46): updateDetails los rechaza para
// ese origin — solo description/implementer siguen editables por el usuario en cualquier caso.
const SYNC_GOVERNED_UPDATE_KEYS: readonly (keyof ProjectUpdateProps)[] = [
  'customerId',
  'customerName',
  'name',
  'status',
  'startDate',
  'endDate'
]

export class Project extends AggregateRoot {
  private constructor(
    private readonly _id: ProjectId,
    private _customerId: CustomerId,
    private _customerName: CustomerName,
    private _name: ProjectName,
    private _description: ProjectDescription,
    private _period: Period,
    private _status: ProjectStatus,
    private _implementer: ProjectImplementer,
    private _origin: ProjectOrigin,
    private _lifecycleStatus: ProjectLifecycleStatus,
    private _archivedAt: Nullable<SyncTimestamp>,
    private _lastSeenInSyncAt: Nullable<SyncTimestamp>,
    // Campos SAP (spec 46), gobernados por el sync; sin invariante propia (crudo tal cual el feed).
    private readonly _sapProjectId: Nullable<SapProjectId>,
    private _atRisk: Nullable<string>,
    private _inEscalation: Nullable<string>,
    private _nbrOfWaves: Nullable<number>,
    private _waveStage: Nullable<string>,
    private _waveStatus: Nullable<string>,
    private _planToGoLive: Nullable<ContractDate>
  ) {
    super()
    this.ensureStartDateConsistency()
  }

  //#region ...Getters...
  get id(): ProjectId {
    return this._id
  }
  get customerId(): CustomerId {
    return this._customerId
  }
  get customerName(): CustomerName {
    return this._customerName
  }
  get name(): ProjectName {
    return this._name
  }
  get status(): ProjectStatus {
    return this._status
  }
  get origin(): ProjectOrigin {
    return this._origin
  }
  get lifecycleStatus(): ProjectLifecycleStatus {
    return this._lifecycleStatus
  }
  get lastSeenInSyncAt(): Nullable<SyncTimestamp> {
    return this._lastSeenInSyncAt
  }
  //#endregion

  static create(props: ProjectAggregateProps): Project {
    return new Project(
      props.id,
      props.customerId,
      props.customerName,
      props.name,
      props.description,
      props.period,
      props.status,
      props.implementer,
      props.origin,
      ProjectLifecycleStatus.active(),
      SyncTimestamp.never(),
      SyncTimestamp.never(),
      props.sapProjectId,
      props.atRisk,
      props.inEscalation,
      props.nbrOfWaves,
      props.waveStage,
      props.waveStatus,
      props.planToGoLive
    )
  }

  static register(props: RegisterProjectProps): Project {
    return Project.create({
      id: ProjectId.create(props.id),
      customerId: CustomerId.create(props.customerId),
      customerName: CustomerName.create(props.customerName),
      name: ProjectName.create(props.name),
      description: ProjectDescription.create(props.description ?? ''),
      period: Period.create(
        ContractDate.create(new Date(props.startDate)),
        props.endDate ? ContractDate.create(new Date(props.endDate)) : null
      ),
      status: ProjectStatus.create(props.status ?? 'planning'),
      implementer: ProjectImplementer.create(props.implementer ?? 'AVVALE'),
      origin: ProjectOrigin.manual(),
      sapProjectId: null,
      atRisk: null,
      inEscalation: null,
      nbrOfWaves: null,
      waveStage: null,
      waveStatus: null,
      planToGoLive: ContractDate.unset()
    })
  }

  /** Alta desde el sync (spec 46): nace ME_SAP, admite startDate null y status null → planning. */
  static registerFromSync(props: RegisterSapProjectProps): Project {
    return Project.create({
      id: ProjectId.create(props.id),
      customerId: CustomerId.create(props.customerId),
      customerName: CustomerName.create(props.customerName),
      name: ProjectName.create(props.name),
      description: ProjectDescription.create(''),
      period: Period.create(props.startDate ? ContractDate.create(new Date(props.startDate)) : null, null),
      status: ProjectStatus.create(props.status ?? 'planning'),
      implementer: ProjectImplementer.create('AVVALE'),
      origin: ProjectOrigin.meSap(),
      sapProjectId: SapProjectId.create(props.sapProjectId),
      atRisk: props.atRisk,
      inEscalation: props.inEscalation,
      nbrOfWaves: props.nbrOfWaves,
      waveStage: props.waveStage,
      waveStatus: props.waveStatus,
      planToGoLive: props.planToGoLive ? ContractDate.create(new Date(props.planToGoLive)) : ContractDate.unset()
    })
  }

  static fromPrimitives(props: ProjectPrimitiveProps): Project {
    return new Project(
      ProjectId.create(props.id),
      CustomerId.create(props.customerId),
      CustomerName.create(props.customerName),
      ProjectName.create(props.name),
      ProjectDescription.create(props.description),
      Period.create(
        props.startDate ? ContractDate.create(new Date(props.startDate)) : null,
        props.endDate ? ContractDate.create(new Date(props.endDate)) : null
      ),
      ProjectStatus.create(props.status),
      ProjectImplementer.create(props.implementer),
      props.origin ? ProjectOrigin.create(props.origin) : ProjectOrigin.manual(),
      props.lifecycleStatus ? ProjectLifecycleStatus.create(props.lifecycleStatus) : ProjectLifecycleStatus.active(),
      props.archivedAt ? SyncTimestamp.fromISOString(props.archivedAt) : null,
      props.lastSeenInSyncAt ? SyncTimestamp.fromISOString(props.lastSeenInSyncAt) : null,
      props.sapProjectId ? SapProjectId.create(props.sapProjectId) : null,
      props.atRisk ?? null,
      props.inEscalation ?? null,
      props.nbrOfWaves ?? null,
      props.waveStage ?? null,
      props.waveStatus ?? null,
      props.planToGoLive ? ContractDate.create(new Date(props.planToGoLive)) : ContractDate.unset()
    )
  }

  toPrimitives(): ProjectPrimitiveProps {
    return {
      id: this._id.value,
      customerId: this._customerId.value,
      customerName: this._customerName.value,
      name: this._name.value,
      description: this._description.value,
      startDate: this._period.start ? this._period.start.toDateString() : null,
      endDate: this._period.end ? this._period.end.toDateString() : null,
      status: this._status.value,
      implementer: this._implementer.value,
      origin: this._origin.value,
      lifecycleStatus: this._lifecycleStatus.value,
      archivedAt: this._archivedAt?.toISOString() ?? null,
      lastSeenInSyncAt: this._lastSeenInSyncAt?.toISOString() ?? null,
      sapProjectId: this._sapProjectId ? this._sapProjectId.value : null,
      atRisk: this._atRisk,
      inEscalation: this._inEscalation,
      nbrOfWaves: this._nbrOfWaves,
      waveStage: this._waveStage,
      waveStatus: this._waveStatus,
      planToGoLive: this._planToGoLive ? this._planToGoLive.toDateString() : null
    }
  }

  updateDetails(updates: ProjectUpdateProps): void {
    this.ensureNoSyncGovernedUpdates(updates)

    if (updates.customerId !== undefined) {
      this._customerId = CustomerId.create(updates.customerId)
    }
    if (updates.customerName !== undefined) {
      this._customerName = CustomerName.create(updates.customerName)
    }
    if (updates.name !== undefined) {
      this._name = ProjectName.create(updates.name)
    }
    if (updates.description !== undefined) {
      this._description = ProjectDescription.create(updates.description)
    }
    if (updates.status !== undefined) {
      this._status = ProjectStatus.create(updates.status)
    }
    if (updates.implementer !== undefined) {
      this._implementer = ProjectImplementer.create(updates.implementer)
    }
    if (updates.startDate !== undefined || 'endDate' in updates) {
      const start =
        updates.startDate !== undefined
          ? updates.startDate
            ? ContractDate.create(new Date(updates.startDate))
            : null
          : this._period.start
      const end =
        'endDate' in updates
          ? updates.endDate
            ? ContractDate.create(new Date(updates.endDate))
            : null
          : this._period.end
      this._period = Period.create(start, end)
    }

    this.ensureStartDateConsistency()
  }

  /** Mutación sync-only (spec 46): nunca la ejerce la edición manual, calca updateMaintenanceFields. */
  updateSapFields(updates: ProjectSapSyncProps): void {
    if (updates.name !== undefined) {
      this._name = ProjectName.create(updates.name)
    }
    if (updates.customerName !== undefined) {
      this._customerName = CustomerName.create(updates.customerName)
    }
    if (updates.status !== undefined) {
      this._status = ProjectStatus.create(updates.status)
    }
    if (updates.startDate !== undefined) {
      const start = updates.startDate ? ContractDate.create(new Date(updates.startDate)) : null
      this._period = Period.create(start, this._period.end)
    }
    if (updates.atRisk !== undefined) {
      this._atRisk = updates.atRisk
    }
    if (updates.inEscalation !== undefined) {
      this._inEscalation = updates.inEscalation
    }
    if (updates.nbrOfWaves !== undefined) {
      this._nbrOfWaves = updates.nbrOfWaves
    }
    if (updates.waveStage !== undefined) {
      this._waveStage = updates.waveStage
    }
    if (updates.waveStatus !== undefined) {
      this._waveStatus = updates.waveStatus
    }
    if (updates.planToGoLive !== undefined) {
      this._planToGoLive = updates.planToGoLive
        ? ContractDate.create(new Date(updates.planToGoLive))
        : ContractDate.unset()
    }

    this.ensureStartDateConsistency()
  }

  /** Marca presencia en un run de sync; si estaba archivado, reaparecer en SAP lo reactiva. */
  markSeenInSync(seenAt: Date): void {
    this._lastSeenInSyncAt = SyncTimestamp.create(seenAt)

    if (this._lifecycleStatus.isArchived()) {
      this._lifecycleStatus = ProjectLifecycleStatus.active()
      this._archivedAt = SyncTimestamp.never()
    }
  }

  /**
   * Archiva por ausencia del proyecto en el feed de SAP. Invariantes: solo los ME_SAP vistos
   * alguna vez en SAP son archivables (un MANUAL no lo gobierna el sync); re-archivar es no-op.
   */
  archive(at: Date): void {
    if (this._lifecycleStatus.isArchived()) {
      return
    }
    if (this._origin.isManual()) {
      throw new ProjectError('Cannot archive a MANUAL project')
    }
    if (this._lastSeenInSyncAt === null) {
      throw new ProjectError('Cannot archive a project never seen in SAP')
    }
    this._lifecycleStatus = ProjectLifecycleStatus.archived()
    this._archivedAt = SyncTimestamp.create(at)
  }

  equals(other: AggregateRoot): boolean {
    if (!(other instanceof Project)) {
      return false
    }
    return this._id.equals(other._id)
  }

  uniquenessKeyIfChanged(
    updates: ProjectUniquenessUpdateProps
  ): Undefinable<{ customerId: CustomerId; name: ProjectName }> {
    const customerId = updates.customerId !== undefined ? CustomerId.create(updates.customerId) : this._customerId
    const name = updates.name !== undefined ? ProjectName.create(updates.name) : this._name

    const unchanged = customerId.equals(this._customerId) && name.equals(this._name)

    if (unchanged) {
      return
    }

    return { customerId, name }
  }

  private ensureNoSyncGovernedUpdates(updates: ProjectUpdateProps): void {
    if (this._origin.isManual()) {
      return
    }
    // `!== undefined` y no `in`: el ValidationPipe (class-transformer) materializa TODA prop del
    // DTO como undefined, así que `in` vetaría cualquier PUT aunque solo traiga campos manuales.
    const attempted = SYNC_GOVERNED_UPDATE_KEYS.filter(key => updates[key] !== undefined)
    if (attempted.length > 0) {
      throw new ProjectError(`Cannot update sync-governed field(s) "${attempted.join(', ')}" on an ME_SAP project`)
    }
  }

  private ensureStartDateConsistency(): void {
    if (this._period.start === null && this._origin.requiresStartDate()) {
      throw new ProjectError(`Start date is required for project origin "${this._origin.value}"`)
    }
  }
}
