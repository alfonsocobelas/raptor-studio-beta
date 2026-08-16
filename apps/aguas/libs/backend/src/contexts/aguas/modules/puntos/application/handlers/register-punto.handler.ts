import { Injectable } from '@nestjs/common'
import { RegisterPuntoInput } from '../dtos/register-punto-input.dto'
import { RegisterPuntoUseCase } from '../use-cases/register-punto-usecase.service'

@Injectable()
export class RegisterPuntoHandler {
  constructor(private readonly useCase: RegisterPuntoUseCase) {}

  async handle(input: RegisterPuntoInput): Promise<void> {
    await this.useCase.invoke(input)
  }
}
