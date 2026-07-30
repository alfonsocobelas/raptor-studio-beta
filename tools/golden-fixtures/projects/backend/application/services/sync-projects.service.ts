import { Injectable } from '@nestjs/common'
import { v7 as uuidv7 } from 'uuid'
import { CustomerRepository } from '../../../customers/domain/customer-repository'
import { SapId } from '../../../customers/domain/value-objects/sap-id.vo'
import { AppLogger } from '../../../../../shared/domain/logger/logger'
import { messageOf } from '../../../../../shared/utils/error-message'
import { Project } from '../../domain/project'
import { ProjectRepository } from '../../domain/project-repository'
import { SapProjectId } from '../../domain/value-objects/sap-project-id.vo'
import {
  SyncProjectFailure,
  SyncProjectRecord,
  SyncProjectsInput,
  SyncProjectsOutput
} from '../dtos/sync-projects-input.dto'

/**
 * Upserts SAP projects extracted from CustomerCloudProjectsV2, keyed by sapProjectId — an identity
 * a MANUAL project never has, so manual projects are structurally out of reach (no claim, unlike
 * contracts). Create defaults: implementer AVVALE, unknown wave stage → planning. Update refreshes
 * only the sync-owned fields via updateSapFields (description/implementer stay manual) and a null
 * status preserves the current one. customerName comes from the canonical Customer (spec 43),
 * never from the feed. Records whose customer is not registered yet are skipped (customers sync
 * first). Reappearing archived projects are reactivated by markSeenInSync.
 */
@Injectable()
export class SyncProjectsService {
  private static readonly CONTEXT = SyncProjectsService.name

  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly customerRepository: CustomerRepository,
    private readonly logger: AppLogger
  ) {}

  async sync(input: SyncProjectsInput): Promise<SyncProjectsOutput> {
    let processed = 0
    let skipped = 0
    const failures: SyncProjectFailure[] = []
    const seenAt = new Date(input.seenAt)

    for (const rawRecord of input.projects) {
      try {
        const sapId = SapId.create(rawRecord.customerSapId)
        const customer = await this.customerRepository.findBySapId(sapId)

        if (!customer) {
          skipped += 1
          continue
        }

        const sapProjectId = SapProjectId.create(rawRecord.sapProjectId)
        const project = await this.projectRepository.findBySapProjectId(sapProjectId)

        if (!project) {
          const newProject = Project.registerFromSync({
            ...rawRecord,
            id: uuidv7(),
            customerId: customer.id.value,
            customerName: customer.name.value
          })
          newProject.markSeenInSync(seenAt)
          await this.projectRepository.register(newProject)
        } else {
          this.applySyncedFields(project, rawRecord, customer.name.value)
          project.markSeenInSync(seenAt)
          await this.projectRepository.save(project)
        }

        processed += 1
      } catch (error) {
        const reason = messageOf(error)
        this.logger.warn(
          `Failed to sync SAP project (${rawRecord.sapProjectId}): ${reason}`,
          SyncProjectsService.CONTEXT
        )
        failures.push({ sapProjectId: rawRecord.sapProjectId, reason })
      }
    }

    return { records: processed, skipped, failures }
  }

  private applySyncedFields(project: Project, rawRecord: SyncProjectRecord, customerName: string): void {
    project.updateSapFields({
      name: rawRecord.name,
      customerName,
      ...(rawRecord.status !== null ? { status: rawRecord.status } : {}),
      startDate: rawRecord.startDate,
      atRisk: rawRecord.atRisk,
      inEscalation: rawRecord.inEscalation,
      nbrOfWaves: rawRecord.nbrOfWaves,
      waveStage: rawRecord.waveStage,
      waveStatus: rawRecord.waveStatus,
      planToGoLive: rawRecord.planToGoLive
    })
  }
}
