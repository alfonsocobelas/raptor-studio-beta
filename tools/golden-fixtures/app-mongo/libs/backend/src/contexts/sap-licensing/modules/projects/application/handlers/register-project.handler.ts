import { Injectable } from '@nestjs/common'
import { RegisterProjectInput } from '../dtos/register-project-input.dto'
import { RegisterProjectUseCase } from '../use-cases/register-project-usecase.service'

@Injectable()
export class RegisterProjectHandler {
  constructor(private readonly useCase: RegisterProjectUseCase) {}

  async handle(input: RegisterProjectInput): Promise<void> {
    await this.useCase.invoke(input)
  }
}
