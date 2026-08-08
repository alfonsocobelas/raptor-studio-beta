import { Injectable } from '@nestjs/common'
import { GetAgenteInput } from '../dtos/get-agente-input.dto'
import { GetAgenteUseCase } from '../use-cases/get-agente-usecase.service'
import { AgentePrimitiveProps } from '../../domain/agente-types'

@Injectable()
export class GetAgenteHandler {
  constructor(private readonly useCase: GetAgenteUseCase) {}

  async handle(input: GetAgenteInput): Promise<AgentePrimitiveProps> {
    return this.useCase.invoke(input)
  }
}
