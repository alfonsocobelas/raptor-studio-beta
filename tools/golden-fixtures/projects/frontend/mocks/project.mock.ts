import { ProjectDto, ProjectImplementerEnum, ProjectStatusEnum } from '@sap-licenses/shared/domain'
import { OffsetPaginatedOutput } from '../project.service'

// Datos de prueba derivados del resource-schema (generados): los specs del servicio y del
// componente los consumen; los valores concretos no importan, la forma sí.
export const MOCK_PROJECTS: ProjectDto[] = [
  {
    id: '019eb713-19bb-7000-8000-000000000001',
    customerId: '019eb713-19bb-7000-8000-000000000002',
    customerName: 'CustomerName 1',
    name: 'Name 1',
    description: 'Description 1',
    startDate: '2026-01-15',
    endDate: '2026-01-15',
    status: ProjectStatusEnum.PLANNING,
    implementer: ProjectImplementerEnum.AVVALE,
    origin: 'Origin 1',
    lifecycleStatus: 'LifecycleStatus 1',
    archivedAt: '2026-01-15T10:00:00.000Z',
    lastSeenInSyncAt: '2026-01-15T10:00:00.000Z',
    sapProjectId: 'SapProjectId 1',
    atRisk: 'AtRisk 1',
    inEscalation: 'InEscalation 1',
    nbrOfWaves: 100,
    waveStage: 'WaveStage 1',
    waveStatus: 'WaveStatus 1',
    planToGoLive: '2026-01-15'
  },
  {
    id: '019eb713-19bb-7000-8000-000000000002',
    customerId: '019eb713-19bb-7000-8000-000000000002',
    customerName: 'CustomerName 2',
    name: 'Name 2',
    description: 'Description 2',
    startDate: null,
    endDate: null,
    status: ProjectStatusEnum.ACTIVE,
    implementer: ProjectImplementerEnum.THIRD_PARTY,
    origin: 'Origin 2',
    lifecycleStatus: 'LifecycleStatus 2',
    archivedAt: null,
    lastSeenInSyncAt: null,
    sapProjectId: null,
    atRisk: null,
    inEscalation: null,
    nbrOfWaves: null,
    waveStage: null,
    waveStatus: null,
    planToGoLive: null
  }
]

export const MOCK_PROJECTS_PAGINATED: OffsetPaginatedOutput<ProjectDto> = {
  total: 2,
  page: 1,
  pageSize: 10,
  totalPages: 1,
  items: MOCK_PROJECTS
}
