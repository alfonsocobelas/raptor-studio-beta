import { Injectable } from '@nestjs/common'
import { AuditTrailPort } from '../../../../../shared/domain/audit/audit-trail.port'
import { EntityNotFoundError } from '../../../../../shared/domain/errors'
import { ProjectId } from '../../../../../shared/domain/value-objects/projects/project-id.vo'
import { ProjectRepository } from '../../domain/project-repository'
import { RemoveProjectInput } from '../dtos/remove-project-input.dto'

@Injectable()
export class RemoveProjectUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly auditTrail: AuditTrailPort
  ) {}

  async invoke(input: RemoveProjectInput): Promise<void> {
    const projectId = ProjectId.create(input.id)
    const project = await this.projectRepository.get(projectId)

    if (!project) {
      throw new EntityNotFoundError('Project', input.id)
    }

    await this.projectRepository.remove(projectId)
    await this.auditTrail.record({
      entity: 'project',
      entityId: projectId.value,
      action: 'deleted',
      changes: {},
      actor: null
    })
  }
}
