import { Injectable } from '@nestjs/common'
import { RestoreProjectInput } from '../dtos/restore-project-input.dto'
import { RestoreProjectUseCase } from '../use-cases/restore-project-usecase.service'

@Injectable()
export class RestoreProjectHandler {
  constructor(private readonly useCase: RestoreProjectUseCase) {}

  async handle(input: RestoreProjectInput): Promise<void> {
    await this.useCase.invoke(input)
  }
}
