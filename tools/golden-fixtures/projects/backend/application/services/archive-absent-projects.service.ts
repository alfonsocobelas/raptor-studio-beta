import { Injectable } from '@nestjs/common'
import { ProjectRepository } from '../../domain/project-repository'
import { activeMeSapProjects } from '../../domain/specifications/active-me-sap-projects.specification'
import { ArchiveAbsentProjectsInput, ArchiveAbsentProjectsOutput } from '../dtos/archive-absent-projects-input.dto'

/**
 * Archiva los proyectos ME_SAP activos cuyo sapProjectId no ha aparecido en el run actual. Lo
 * invoca ArchivePhase solo tras un run 100% exitoso: un fallo de fetch no puede decidir qué
 * proyectos existen. Los MANUAL nunca son candidatos (la spec filtra ME_SAP) y los nunca-vistos
 * o sin sapProjectId se descartan en memoria (Criteria no expresa IS NOT NULL).
 */
@Injectable()
export class ArchiveAbsentProjectsService {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async archive(input: ArchiveAbsentProjectsInput): Promise<ArchiveAbsentProjectsOutput> {
    const seen = new Set(input.seenKeys)
    const archivedAt = new Date(input.archivedAt)
    const candidates = await this.projectRepository.matching(activeMeSapProjects())

    let archived = 0
    for (const project of candidates) {
      const primitives = project.toPrimitives()
      if (primitives.lastSeenInSyncAt === null) {
        continue
      }
      if (!primitives.sapProjectId || seen.has(primitives.sapProjectId)) {
        continue
      }
      project.archive(archivedAt)
      await this.projectRepository.save(project)
      archived += 1
    }

    return { archived }
  }
}
