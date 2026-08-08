import { Injectable } from '@nestjs/common'
import { AuditTrailPort } from '../../../../../shared/domain/audit/audit-trail.port'
import { EntityNotFoundError } from '../../../../../shared/domain/errors'
import { ProjectId } from '../../../../../shared/domain/value-objects/projects/project-id.vo'
import { ProjectRepository } from '../../domain/project-repository'
import { RestoreProjectInput } from '../dtos/restore-project-input.dto'

@Injectable()
export class RestoreProjectUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly auditTrail: AuditTrailPort
  ) {}

  async invoke(input: RestoreProjectInput): Promise<void> {
    const restored = await this.projectRepository.restore(ProjectId.create(input.id))

    if (!restored) {
      throw new EntityNotFoundError('Project', input.id)
    }
    await this.auditTrail.record({
      entity: 'project',
      entityId: input.id,
      action: 'restored',
      changes: {},
      actor: null
    })
  }
}
