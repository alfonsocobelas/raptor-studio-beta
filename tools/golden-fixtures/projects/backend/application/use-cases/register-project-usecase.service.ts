import { Injectable } from '@nestjs/common'
import { AlreadyExistsError } from '../../../../../shared/domain/errors'
import { Project } from '../../domain/project'
import { ProjectRepository } from '../../domain/project-repository'
import { withCustomerIdAndName } from '../../domain/specifications/project-with-customer-and-name.specification'
import { RegisterProjectInput } from '../dtos/register-project-input.dto'

@Injectable()
export class RegisterProjectUseCase {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async invoke(input: RegisterProjectInput): Promise<void> {
    const project = Project.register(input)

    const existProject = await this.projectRepository.exists(withCustomerIdAndName(project.customerId, project.name))

    if (existProject) {
      throw new AlreadyExistsError('Project', 'name', project.name.value)
    }

    await this.projectRepository.register(project)
  }
}
