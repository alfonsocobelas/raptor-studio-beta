import { Injectable } from '@nestjs/common'
import { UpdateAgenteInput } from '../dtos/update-agente-input.dto'
import { UpdateAgenteUseCase } from '../use-cases/update-agente-usecase.service'

@Injectable()
export class UpdateAgenteHandler {
  constructor(private readonly useCase: UpdateAgenteUseCase) {}

  async handle(input: UpdateAgenteInput): Promise<void> {
    await this.useCase.invoke(input)
  }
}
