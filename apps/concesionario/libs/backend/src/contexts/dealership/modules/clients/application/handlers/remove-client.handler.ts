import { Injectable } from '@nestjs/common'
import { RemoveClientInput } from '../dtos/remove-client-input.dto'
import { RemoveClientUseCase } from '../use-cases/remove-client-usecase.service'

@Injectable()
export class RemoveClientHandler {
  constructor(private readonly useCase: RemoveClientUseCase) {}

  async handle(input: RemoveClientInput): Promise<void> {
    await this.useCase.invoke(input)
  }
}
