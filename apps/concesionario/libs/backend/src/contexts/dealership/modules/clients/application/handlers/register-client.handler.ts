import { Injectable } from '@nestjs/common'
import { RegisterClientInput } from '../dtos/register-client-input.dto'
import { RegisterClientUseCase } from '../use-cases/register-client-usecase.service'

@Injectable()
export class RegisterClientHandler {
  constructor(private readonly useCase: RegisterClientUseCase) {}

  async handle(input: RegisterClientInput): Promise<void> {
    await this.useCase.invoke(input)
  }
}
