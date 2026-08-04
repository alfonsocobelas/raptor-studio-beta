import { Nullable } from '../../../../shared/domain/types'
import { ProjectId } from '../../../../shared/domain/value-objects/projects/project-id.vo'
import { CustomerId } from '../../../../shared/domain/value-objects/customers/customer-id.vo'
import { ContractDate } from '../../../shared/domain/value-objects/contract-date.vo'
import { CustomerName } from '../../../shared/domain/value-objects/customer-name.vo'
import { Period } from '../../../shared/domain/value-objects/period.vo'
import { ProjectDescription } from './value-objects/project-description.vo'
import { ProjectImplementer } from './value-objects/project-implementer.vo'
import { ProjectName } from './value-objects/project-name.vo'
import { ProjectStatus } from './value-objects/project-status.vo'
import { SapProjectId } from './value-objects/sap-project-id.vo'

export interface ProjectAggregateProps {
  id: ProjectId
  customerId: CustomerId
  customerName: CustomerName
  name: ProjectName
  description: ProjectDescription
  status: ProjectStatus
  implementer: ProjectImplementer
  sapProjectId: Nullable<SapProjectId>
  atRisk: Nullable<string>
  inEscalation: Nullable<string>
  nbrOfWaves: Nullable<number>
  waveStage: Nullable<string>
  waveStatus: Nullable<string>
  planToGoLive: Nullable<ContractDate>
  period: Period
}

export interface ProjectPrimitiveProps {
  id: string
  customerId: string
  customerName: string
  name: string
  description: string
  startDate: Nullable<string>
  endDate: Nullable<string>
  status: string
  implementer: string
  origin?: string
  lifecycleStatus?: string
  archivedAt?: Nullable<string>
  lastSeenInSyncAt?: Nullable<string>
  sapProjectId?: Nullable<string>
  atRisk?: Nullable<string>
  inEscalation?: Nullable<string>
  nbrOfWaves?: Nullable<number>
  waveStage?: Nullable<string>
  waveStatus?: Nullable<string>
  planToGoLive?: Nullable<string>
}

export type ProjectUpdateProps = Partial<
  Omit<
    ProjectPrimitiveProps,
    | 'id'
    | 'origin'
    | 'lifecycleStatus'
    | 'archivedAt'
    | 'lastSeenInSyncAt'
    | 'sapProjectId'
    | 'atRisk'
    | 'inEscalation'
    | 'nbrOfWaves'
    | 'waveStage'
    | 'waveStatus'
    | 'planToGoLive'
  >
>

export type ProjectUniquenessUpdateProps = Pick<ProjectUpdateProps, 'name'>

export interface RegisterProjectProps {
  id: string
  customerId: string
  customerName: string
  name: string
  description?: string
  startDate: Nullable<string>
  endDate?: string | null
  status?: string
  implementer?: string
}
