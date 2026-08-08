import { Injectable } from '@nestjs/common'
import { AlreadyExistsError } from '../../../../../shared/domain/errors'
import { AuditTrailPort } from '../../../../../shared/domain/audit/audit-trail.port'
import { Project } from '../../domain/project'
import { ProjectRepository } from '../../domain/project-repository'
import { withName } from '../../domain/specifications/project-with-name.specification'
import { RegisterProjectInput } from '../dtos/register-project-input.dto'

@Injectable()
export class RegisterProjectUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly auditTrail: AuditTrailPort
  ) {}

  async invoke(input: RegisterProjectInput): Promise<void> {
    const project = Project.register(input)
    const nameExists = await this.projectRepository.exists(withName(project.name))

    if (nameExists) {
      throw new AlreadyExistsError('Project', 'name', project.name.value)
    }

    await this.projectRepository.register(project)
    await this.auditTrail.record({
      entity: 'project',
      entityId: project.id.value,
      action: 'created',
      changes: {},
      actor: null
    })
  }
}
