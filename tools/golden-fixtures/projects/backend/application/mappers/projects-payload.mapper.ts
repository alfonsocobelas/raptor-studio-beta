import { Nullable } from '../../../../../shared/domain/types'
import { SyncProjectRecord } from '../dtos/sync-projects-input.dto'

export interface ProjectsPayloadOutput {
  projects: SyncProjectRecord[]
  skippedInvalid: number
}

// Mapeo waveStage → ProjectStatus (spec 46): Live = entregado. Stage desconocido → status null
// (create cae al default planning, update conserva el actual — nunca se inventa un ciclo de vida).
export const PROJECT_STATUS_BY_WAVE_STAGE: Record<string, string> = {
  'Not Started': 'planning',
  Implementing: 'active',
  Live: 'closed'
}

// La web de SAP for Me no tiene nombre libre de proyecto: lo compone por área. Nuestro título
// usa el área preview + projectId (unicidad garantizada). Sin área (no visto en vivo) → genérico.
const FALLBACK_AREA_LABEL = 'SAP Project'

/**
 * Maps the raw OData payload of CustomerCloudProjectsV2 (partner) into project sync records.
 * One row per SAP project (probe 2026-07-21: projectId unique 32/32, aggregated preview of the
 * running wave). Rows without projectId or customerId are dropped and counted via skippedInvalid.
 * Empty strings map to null (atRisk/inEscalation were empty 32/32 live — format unknown, kept raw).
 */
export class ProjectsPayloadMapper {
  static toSyncRecords(rows: Record<string, unknown>[]): ProjectsPayloadOutput {
    const projects: SyncProjectRecord[] = []
    let skippedInvalid = 0

    for (const row of rows) {
      const sapProjectId = String(row.projectId ?? '').trim()
      const customerSapId = String(row.customerId ?? '').trim()
      if (!sapProjectId || !customerSapId) {
        skippedInvalid += 1
        continue
      }

      const previewArea = this.textOrNull(row.previewSubSolutionAreaName) ?? FALLBACK_AREA_LABEL
      const waveStage = this.textOrNull(row.waveStage)

      projects.push({
        sapProjectId,
        customerSapId,
        name: `${previewArea} (${sapProjectId})`,
        status: waveStage === null ? null : (PROJECT_STATUS_BY_WAVE_STAGE[waveStage] ?? null),
        startDate: this.textOrNull(row.kickOffDate),
        atRisk: this.textOrNull(row.atRisk),
        inEscalation: this.textOrNull(row.inEscalation),
        nbrOfWaves: this.parseCount(row.nbrOfWaves),
        waveStage,
        waveStatus: this.textOrNull(row.waveStatus),
        planToGoLive: this.textOrNull(row.planToGoLive)
      })
    }

    return { projects, skippedInvalid }
  }

  private static textOrNull(value: unknown): Nullable<string> {
    const text = String(value ?? '').trim()
    return text === '' ? null : text
  }

  // Acepta number y string numérico (IEEE754Compatible); cualquier otra cosa → null, no se inventa.
  private static parseCount(value: unknown): Nullable<number> {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null
    }
    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value)
      return Number.isFinite(parsed) ? parsed : null
    }
    return null
  }
}
