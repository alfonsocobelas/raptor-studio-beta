import { Nullable } from '../../../../shared/domain/types'
import { CustomerId } from '../../../../shared/domain/value-objects/customers/customer-id.vo'
import { ProjectId } from '../../../../shared/domain/value-objects/projects/project-id.vo'
import { CustomerName } from '../../../shared/domain/value-objects/customer-name.vo'
import { Period } from '../../../shared/domain/value-objects/period.vo'
import { ContractDate } from '../../../shared/domain/value-objects/contract-date.vo'
import { ProjectDescription } from './value-objects/project-description.vo'
import { ProjectImplementer } from './value-objects/project-implementer.vo'
import { ProjectName } from './value-objects/project-name.vo'
import { ProjectOrigin } from './value-objects/project-origin.vo'
import { ProjectStatus } from './value-objects/project-status.vo'
import { SapProjectId } from './value-objects/sap-project-id.vo'

export interface ProjectAggregateProps {
  id: ProjectId
  customerId: CustomerId
  customerName: CustomerName
  name: ProjectName
  description: ProjectDescription
  period: Period
  status: ProjectStatus
  implementer: ProjectImplementer
  origin: ProjectOrigin
  sapProjectId: Nullable<SapProjectId>
  atRisk: Nullable<string>
  inEscalation: Nullable<string>
  nbrOfWaves: Nullable<number>
  waveStage: Nullable<string>
  waveStatus: Nullable<string>
  planToGoLive: Nullable<ContractDate>
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

export interface RegisterProjectProps {
  id: string
  customerId: string
  customerName: string
  name: string
  startDate: string
  description?: string
  endDate?: string | null
  status?: string
  implementer?: string
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

export type ProjectUniquenessUpdateProps = Pick<ProjectUpdateProps, 'customerId' | 'name'>

// Campos que solo el sync gobierna en un proyecto ME_SAP (spec 46): la identidad (sapProjectId)
// es de solo alta, no se re-asigna por update — por eso NO forma parte de este tipo.
// customerName se refresca desde el Customer canónico (spec 43), nunca desde el feed de proyectos.
export interface ProjectSapSyncProps {
  name?: string
  customerName?: string
  status?: string
  startDate?: Nullable<string>
  atRisk?: Nullable<string>
  inEscalation?: Nullable<string>
  nbrOfWaves?: Nullable<number>
  waveStage?: Nullable<string>
  waveStatus?: Nullable<string>
  planToGoLive?: Nullable<string>
}

// Alta desde el sync (spec 46): a diferencia de RegisterProjectProps (manual), permite startDate
// null, exige sapProjectId y nace ME_SAP; status null (stage desconocido) cae al default planning.
export interface RegisterSapProjectProps {
  id: string
  customerId: string
  customerName: string
  name: string
  sapProjectId: string
  status: Nullable<string>
  startDate: Nullable<string>
  atRisk: Nullable<string>
  inEscalation: Nullable<string>
  nbrOfWaves: Nullable<number>
  waveStage: Nullable<string>
  waveStatus: Nullable<string>
  planToGoLive: Nullable<string>
}
