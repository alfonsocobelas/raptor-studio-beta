import { Injectable } from '@nestjs/common'
import { RegisterClienteInput } from '../dtos/register-cliente-input.dto'
import { RegisterClienteUseCase } from '../use-cases/register-cliente-usecase.service'

@Injectable()
export class RegisterClienteHandler {
  constructor(private readonly useCase: RegisterClienteUseCase) {}

  async handle(input: RegisterClienteInput): Promise<void> {
    await this.useCase.invoke(input)
  }
}
