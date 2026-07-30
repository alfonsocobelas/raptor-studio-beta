import { Injectable } from '@nestjs/common'
import { messageOf } from '../../../../../shared/utils/error-message'
import { SapEndpointDef, SapForMeGateway, SapSession } from '../../../sap-sync/domain/sap-for-me-gateway'
import { PhaseResult, SapSyncPhase, SyncPhaseContext } from '../../../sap-sync/domain/sap-sync-phase'
import { SyncCategory } from '../../../sap-sync/domain/sync-run-types'
import { ProjectsPayloadMapper } from '../mappers/projects-payload.mapper'
import { SyncProjectsService } from '../services/sync-projects.service'

// Proyectos cloud del partner (spec 46): una fila por proyecto, con preview de la wave en curso.
const PROJECTS_ENDPOINT: SapEndpointDef = {
  service: 'partner',
  entity: 'CustomerCloudProjectsV2'
}

/**
 * Phase 6 of the SAP sync run: ingests SAP projects from CustomerCloudProjectsV2, upserted by
 * sapProjectId (an identity manual projects never have — they are untouchable by design). Errors
 * propagate so the orchestrator records the category failure and continues. Deposits the seen
 * sapProjectIds for ArchivePhase.
 */
@Injectable()
export class SyncProjectsPhase implements SapSyncPhase {
  readonly category: SyncCategory = 'projects'

  constructor(
    private readonly gateway: SapForMeGateway,
    private readonly syncProjects: SyncProjectsService
  ) {}

  async execute(session: SapSession, ctx: SyncPhaseContext): Promise<PhaseResult> {
    const rows = await this.fetchProjects(session)
    const mapped = ProjectsPayloadMapper.toSyncRecords(rows)

    ctx.seenSapProjectIds.push(...mapped.projects.map(project => project.sapProjectId))

    const output = await this.syncProjects.sync({ projects: mapped.projects, seenAt: ctx.seenAt })
    return { records: output.records, failures: output.failures.length + mapped.skippedInvalid }
  }

  private async fetchProjects(session: SapSession): Promise<Record<string, unknown>[]> {
    try {
      return await this.gateway.fetch(session, PROJECTS_ENDPOINT)
    } catch (error) {
      throw new Error(`Fetch of "${PROJECTS_ENDPOINT.entity}" failed: ${messageOf(error)}`)
    }
  }
}
