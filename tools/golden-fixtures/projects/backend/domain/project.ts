import { AggregateRoot } from '../../../../shared/domain/aggregate-root'
import { Nullable, Undefinable } from '../../../../shared/domain/types'
import { ProjectId } from '../../../../shared/domain/value-objects/projects/project-id.vo'
import { CustomerId } from '../../../../shared/domain/value-objects/customers/customer-id.vo'
import { ContractDate } from '../../../shared/domain/value-objects/contract-date.vo'
import { CustomerName } from '../../../shared/domain/value-objects/customer-name.vo'
import { Period } from '../../../shared/domain/value-objects/period.vo'
import { SyncTimestamp } from '../../../shared/domain/value-objects/sync-timestamp.vo'
import {
  ProjectAggregateProps,
  ProjectPrimitiveProps,
  ProjectUniquenessUpdateProps,
  ProjectUpdateProps,
  RegisterProjectProps
} from './project-types'
import { ProjectDescription } from './value-objects/project-description.vo'
import { ProjectImplementer } from './value-objects/project-implementer.vo'
import { ProjectLifecycleStatus } from './value-objects/project-lifecycle-status.vo'
import { ProjectName } from './value-objects/project-name.vo'
import { ProjectOrigin } from './value-objects/project-origin.vo'
import { ProjectStatus } from './value-objects/project-status.vo'
import { SapProjectId } from './value-objects/sap-project-id.vo'

export class Project extends AggregateRoot {
  private constructor(
    private readonly _id: ProjectId,
    private _customerId: CustomerId,
    private _customerName: CustomerName,
    private _name: ProjectName,
    private _description: ProjectDescription,
    private _status: ProjectStatus,
    private _implementer: ProjectImplementer,
    private _origin: ProjectOrigin,
    private _lifecycleStatus: ProjectLifecycleStatus,
    private _archivedAt: Nullable<SyncTimestamp>,
    private _lastSeenInSyncAt: Nullable<SyncTimestamp>,
    private _sapProjectId: Nullable<SapProjectId>,
    private _atRisk: Nullable<string>,
    private _inEscalation: Nullable<string>,
    private _nbrOfWaves: Nullable<number>,
    private _waveStage: Nullable<string>,
    private _waveStatus: Nullable<string>,
    private _planToGoLive: Nullable<ContractDate>,
    private _period: Period
  ) {
    super()
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
  get description(): ProjectDescription {
    return this._description
  }
  get status(): ProjectStatus {
    return this._status
  }
  get implementer(): ProjectImplementer {
    return this._implementer
  }
  get origin(): ProjectOrigin {
    return this._origin
  }
  get lifecycleStatus(): ProjectLifecycleStatus {
    return this._lifecycleStatus
  }
  get archivedAt(): Nullable<SyncTimestamp> {
    return this._archivedAt
  }
  get lastSeenInSyncAt(): Nullable<SyncTimestamp> {
    return this._lastSeenInSyncAt
  }
  get sapProjectId(): Nullable<SapProjectId> {
    return this._sapProjectId
  }
  get atRisk(): Nullable<string> {
    return this._atRisk
  }
  get inEscalation(): Nullable<string> {
    return this._inEscalation
  }
  get nbrOfWaves(): Nullable<number> {
    return this._nbrOfWaves
  }
  get waveStage(): Nullable<string> {
    return this._waveStage
  }
  get waveStatus(): Nullable<string> {
    return this._waveStatus
  }
  get planToGoLive(): Nullable<ContractDate> {
    return this._planToGoLive
  }
  get period(): Period {
    return this._period
  }
  //#endregion

  static create(props: ProjectAggregateProps): Project {
    return new Project(
      props.id,
      props.customerId,
      props.customerName,
      props.name,
      props.description,
      props.status,
      props.implementer,
      ProjectOrigin.create('MANUAL'),
      ProjectLifecycleStatus.create('active'),
      null,
      null,
      props.sapProjectId,
      props.atRisk,
      props.inEscalation,
      props.nbrOfWaves,
      props.waveStage,
      props.waveStatus,
      props.planToGoLive,
      props.period
    )
  }

  static register(props: RegisterProjectProps): Project {
    return Project.create({
      id: ProjectId.create(props.id),
      customerId: CustomerId.create(props.customerId),
      customerName: CustomerName.create(props.customerName),
      name: ProjectName.create(props.name),
      description: ProjectDescription.create(props.description ?? ''),
      status: ProjectStatus.create(props.status ?? 'planning'),
      implementer: ProjectImplementer.create(props.implementer ?? 'AVVALE'),
      sapProjectId: props.sapProjectId === null ? null : SapProjectId.create(props.sapProjectId),
      atRisk: props.atRisk,
      inEscalation: props.inEscalation,
      nbrOfWaves: props.nbrOfWaves,
      waveStage: props.waveStage,
      waveStatus: props.waveStatus,
      planToGoLive: ContractDate.create(props.planToGoLive ?? ''),
      period: Period.create(
        props.startDate ? ContractDate.create(new Date(props.startDate)) : null,
        props.endDate ? ContractDate.create(new Date(props.endDate)) : null
      )
    })
  }

  static fromPrimitives(props: ProjectPrimitiveProps): Project {
    return new Project(
      ProjectId.create(props.id),
      CustomerId.create(props.customerId),
      CustomerName.create(props.customerName),
      ProjectName.create(props.name),
      ProjectDescription.create(props.description),
      ProjectStatus.create(props.status),
      ProjectImplementer.create(props.implementer),
      props.origin ? ProjectOrigin.create(props.origin) : ProjectOrigin.create('MANUAL'),
      props.lifecycleStatus
        ? ProjectLifecycleStatus.create(props.lifecycleStatus)
        : ProjectLifecycleStatus.create('active'),
      props.archivedAt ? SyncTimestamp.fromISOString(props.archivedAt) : null,
      props.lastSeenInSyncAt ? SyncTimestamp.fromISOString(props.lastSeenInSyncAt) : null,
      props.sapProjectId ? SapProjectId.create(props.sapProjectId) : null,
      props.atRisk ?? null,
      props.inEscalation ?? null,
      props.nbrOfWaves ?? null,
      props.waveStage ?? null,
      props.waveStatus ?? null,
      props.planToGoLive ? ContractDate.create(new Date(props.planToGoLive)) : ContractDate.unset(),
      Period.create(
        props.startDate ? ContractDate.create(new Date(props.startDate)) : null,
        props.endDate ? ContractDate.create(new Date(props.endDate)) : null
      )
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
    if (!(other instanceof Project)) {
      return false
    }
    return this._id.equals(other._id)
  }

  newNameIfChanged(updates: ProjectUniquenessUpdateProps): Undefinable<ProjectName> {
    if (!updates.name) {
      return
    }

    const newName = ProjectName.create(updates.name)

    if (this._name.equals(newName)) {
      return
    }

    return newName
  }
}
