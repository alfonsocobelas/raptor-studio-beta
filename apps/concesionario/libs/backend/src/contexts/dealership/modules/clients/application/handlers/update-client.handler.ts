import { Injectable } from '@nestjs/common'
import { UpdateClientInput } from '../dtos/update-client-input.dto'
import { UpdateClientUseCase } from '../use-cases/update-client-usecase.service'

@Injectable()
export class UpdateClientHandler {
  constructor(private readonly useCase: UpdateClientUseCase) {}

  async handle(input: UpdateClientInput): Promise<void> {
    await this.useCase.invoke(input)
  }
}
