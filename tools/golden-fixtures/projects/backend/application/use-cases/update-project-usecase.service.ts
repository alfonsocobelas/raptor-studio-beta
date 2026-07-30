import { Injectable } from '@nestjs/common'
import { AlreadyExistsError, EntityNotFoundError } from '../../../../../shared/domain/errors'
import { ProjectId } from '../../../../../shared/domain/value-objects/projects/project-id.vo'
import { ProjectRepository } from '../../domain/project-repository'
import { withCustomerIdAndName } from '../../domain/specifications/project-with-customer-and-name.specification'
import { UpdateProjectInput } from '../dtos/update-project-input.dto'

@Injectable()
export class UpdateProjectUseCase {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async invoke(input: UpdateProjectInput): Promise<void> {
    const projectId = ProjectId.create(input.id)
    const project = await this.projectRepository.get(projectId)

    if (!project) {
      throw new EntityNotFoundError('Project', projectId.value)
    }

    const newKey = project.uniquenessKeyIfChanged(input.updates)

    if (newKey) {
      const nameExists = await this.projectRepository.exists(withCustomerIdAndName(newKey.customerId, newKey.name))

      if (nameExists) {
        throw new AlreadyExistsError('Project', 'name', newKey.name.value)
      }
    }

    project.updateDetails(input.updates)
    await this.projectRepository.save(project)
  }
}
