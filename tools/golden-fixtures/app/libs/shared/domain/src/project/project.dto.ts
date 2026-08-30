import { ProjectStatusEnum, ProjectImplementerEnum } from './project-enums'

export interface ProjectDto {
  id: string
  customerId: string
  customerName: string
  name: string
  description: string
  startDate: string | null
  endDate: string | null
  status: ProjectStatusEnum
  implementer: ProjectImplementerEnum
  origin: string
  lifecycleStatus: string
  archivedAt: string | null
  lastSeenInSyncAt: string | null
  sapProjectId: string | null
  atRisk: string | null
  inEscalation: string | null
  nbrOfWaves: number | null
  waveStage: string | null
  waveStatus: string | null
  planToGoLive: string | null
  version: number
}
