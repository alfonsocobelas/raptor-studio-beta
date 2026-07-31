import { Injectable } from '@nestjs/common'
import { UpdateProjectInput } from '../dtos/update-project-input.dto'
import { UpdateProjectUseCase } from '../use-cases/update-project-usecase.service'

@Injectable()
export class UpdateProjectHandler {
  constructor(private readonly useCase: UpdateProjectUseCase) {}

  async handle(input: UpdateProjectInput): Promise<void> {
    await this.useCase.invoke(input)
  }
}
