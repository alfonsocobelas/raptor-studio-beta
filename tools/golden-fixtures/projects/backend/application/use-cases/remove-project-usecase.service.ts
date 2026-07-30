import { Injectable } from '@nestjs/common'
import { EntityNotFoundError } from '../../../../../shared/domain/errors'
import { ProjectId } from '../../../../../shared/domain/value-objects/projects/project-id.vo'
import { ProjectError } from '../../domain/project-errors'
import { ProjectRepository } from '../../domain/project-repository'
import { RemoveProjectInput } from '../dtos/remove-project-input.dto'

@Injectable()
export class RemoveProjectUseCase {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async invoke(input: RemoveProjectInput): Promise<void> {
    const projectId = ProjectId.create(input.id)
    const project = await this.projectRepository.get(projectId)

    if (!project) {
      throw new EntityNotFoundError('Project', input.id)
    }

    // Un ME_SAP borrado resucitaría en el siguiente run: su ciclo de vida es el archivado (spec 46).
    if (!project.origin.isManual()) {
      throw new ProjectError('Cannot remove an ME_SAP project: its lifecycle is governed by the SAP sync')
    }

    await this.projectRepository.remove(projectId)
  }
}
