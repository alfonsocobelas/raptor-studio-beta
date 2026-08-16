import { Injectable } from '@nestjs/common'
import { RegisterParametroInput } from '../dtos/register-parametro-input.dto'
import { RegisterParametroUseCase } from '../use-cases/register-parametro-usecase.service'

@Injectable()
export class RegisterParametroHandler {
  constructor(private readonly useCase: RegisterParametroUseCase) {}

  async handle(input: RegisterParametroInput): Promise<void> {
    await this.useCase.invoke(input)
  }
}
