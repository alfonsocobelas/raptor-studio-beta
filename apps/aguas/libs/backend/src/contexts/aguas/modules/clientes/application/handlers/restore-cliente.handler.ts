import { Injectable } from '@nestjs/common'
import { RestoreClienteInput } from '../dtos/restore-cliente-input.dto'
import { RestoreClienteUseCase } from '../use-cases/restore-cliente-usecase.service'

@Injectable()
export class RestoreClienteHandler {
  constructor(private readonly useCase: RestoreClienteUseCase) {}

  async handle(input: RestoreClienteInput): Promise<void> {
    await this.useCase.invoke(input)
  }
}
