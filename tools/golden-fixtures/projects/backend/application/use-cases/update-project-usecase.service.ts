import { Injectable } from '@nestjs/common'
import { AlreadyExistsError, EntityNotFoundError } from '../../../../../shared/domain/errors'
import { changesBetween } from '../../../../../shared/domain/audit/audit-changes'
import { AuditTrailPort } from '../../../../../shared/domain/audit/audit-trail.port'
import { ProjectRepository } from '../../domain/project-repository'
import { withName } from '../../domain/specifications/project-with-name.specification'
import { ProjectId } from '../../../../../shared/domain/value-objects/projects/project-id.vo'
import { UpdateProjectInput } from '../dtos/update-project-input.dto'

@Injectable()
export class UpdateProjectUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly auditTrail: AuditTrailPort
  ) {}

  async invoke(input: UpdateProjectInput): Promise<void> {
    const projectId = ProjectId.create(input.id)
    const project = await this.projectRepository.get(projectId)

    if (!project) {
      throw new EntityNotFoundError('Project', input.id)
    }

    const newName = project.newNameIfChanged(input.updates)

    if (newName) {
      const nameExists = await this.projectRepository.exists(withName(newName))

      if (nameExists) {
        throw new AlreadyExistsError('Project', 'name', newName.value)
      }
    }

    const before = project.toPrimitives()
    project.updateDetails(input.updates)
    await this.projectRepository.save(project)
    await this.auditTrail.record({
      entity: 'project',
      entityId: projectId.value,
      action: 'updated',
      changes: changesBetween(before, project.toPrimitives()),
      actor: null
    })
  }
}
