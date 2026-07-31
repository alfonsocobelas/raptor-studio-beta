import { Injectable } from '@nestjs/common'
import { RemoveProjectInput } from '../dtos/remove-project-input.dto'
import { RemoveProjectUseCase } from '../use-cases/remove-project-usecase.service'

@Injectable()
export class RemoveProjectHandler {
  constructor(private readonly useCase: RemoveProjectUseCase) {}

  async handle(input: RemoveProjectInput): Promise<void> {
    await this.useCase.invoke(input)
  }
}
