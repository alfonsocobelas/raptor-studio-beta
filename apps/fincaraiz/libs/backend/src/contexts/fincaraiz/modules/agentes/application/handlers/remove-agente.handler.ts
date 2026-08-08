import { Injectable } from '@nestjs/common'
import { RemoveAgenteInput } from '../dtos/remove-agente-input.dto'
import { RemoveAgenteUseCase } from '../use-cases/remove-agente-usecase.service'

@Injectable()
export class RemoveAgenteHandler {
  constructor(private readonly useCase: RemoveAgenteUseCase) {}

  async handle(input: RemoveAgenteInput): Promise<void> {
    await this.useCase.invoke(input)
  }
}
