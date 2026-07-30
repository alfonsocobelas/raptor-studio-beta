import { Injectable } from '@nestjs/common'
import { EntityNotFoundError } from '../../../../../shared/domain/errors'
import { ProjectId } from '../../../../../shared/domain/value-objects/projects/project-id.vo'
import { ProjectRepository } from '../../domain/project-repository'
import { ProjectPrimitiveProps } from '../../domain/project-types'
import { GetProjectInput } from '../dtos/get-project-input.dto'

@Injectable()
export class GetProjectUseCase {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async invoke(input: GetProjectInput): Promise<ProjectPrimitiveProps> {
    const projectId = ProjectId.create(input.id)
    const project = await this.projectRepository.get(projectId)

    if (!project) {
      throw new EntityNotFoundError('Project', input.id)
    }

    return project.toPrimitives()
  }
}
