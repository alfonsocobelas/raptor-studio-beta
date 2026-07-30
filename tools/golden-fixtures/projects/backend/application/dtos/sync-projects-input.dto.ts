import { Nullable } from '../../../../../shared/domain/types'

// Registro de CustomerCloudProjectsV2 (spec 46): un proyecto SAP por fila (probe 2026-07-21:
// projectId único 32/32). La clave de upsert/archivado es sapProjectId.
export interface SyncProjectRecord {
  sapProjectId: string
  customerSapId: string
  name: string
  // null = waveStage desconocido: create cae al default planning, update conserva el status actual
  status: Nullable<string>
  startDate: Nullable<string>
  atRisk: Nullable<string>
  inEscalation: Nullable<string>
  nbrOfWaves: Nullable<number>
  waveStage: Nullable<string>
  waveStatus: Nullable<string>
  planToGoLive: Nullable<string>
}

export interface SyncProjectsInput {
  projects: SyncProjectRecord[]
  seenAt: string
}

export interface SyncProjectFailure {
  sapProjectId: string
  reason: string
}

export interface SyncProjectsOutput {
  records: number
  skipped: number
  failures: SyncProjectFailure[]
}
