import { Injectable } from '@nestjs/common'
import { EntityNotFoundError } from '../../../../../shared/domain/errors'
import { ProjectId } from '../../../../../shared/domain/value-objects/projects/project-id.vo'
import { ProjectRepository } from '../../domain/project-repository'
import { RestoreProjectInput } from '../dtos/restore-project-input.dto'

@Injectable()
export class RestoreProjectUseCase {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async invoke(input: RestoreProjectInput): Promise<void> {
    const restored = await this.projectRepository.restore(ProjectId.create(input.id))

    if (!restored) {
      throw new EntityNotFoundError('Project', input.id)
    }
  }
}
