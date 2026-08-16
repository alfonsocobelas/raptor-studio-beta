import { Injectable } from '@nestjs/common'
import { UpdateClienteInput } from '../dtos/update-cliente-input.dto'
import { UpdateClienteUseCase } from '../use-cases/update-cliente-usecase.service'

@Injectable()
export class UpdateClienteHandler {
  constructor(private readonly useCase: UpdateClienteUseCase) {}

  async handle(input: UpdateClienteInput): Promise<void> {
    await this.useCase.invoke(input)
  }
}
