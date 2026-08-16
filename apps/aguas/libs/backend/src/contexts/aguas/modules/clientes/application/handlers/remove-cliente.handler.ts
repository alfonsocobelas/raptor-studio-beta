import { Injectable } from '@nestjs/common'
import { RemoveClienteInput } from '../dtos/remove-cliente-input.dto'
import { RemoveClienteUseCase } from '../use-cases/remove-cliente-usecase.service'

@Injectable()
export class RemoveClienteHandler {
  constructor(private readonly useCase: RemoveClienteUseCase) {}

  async handle(input: RemoveClienteInput): Promise<void> {
    await this.useCase.invoke(input)
  }
}
