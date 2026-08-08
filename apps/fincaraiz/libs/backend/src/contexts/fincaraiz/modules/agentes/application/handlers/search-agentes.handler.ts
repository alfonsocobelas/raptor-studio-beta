import { Injectable } from '@nestjs/common'
import { OffsetPaginatedOutput } from '../../../../../shared/application/dtos/search-output.dto'
import { OffsetInput } from '../../../../../shared/domain/query/criteria'
import { AgentePrimitiveProps } from '../../domain/agente-types'
import { SearchAgentesUseCase } from '../use-cases/search-agentes-usecase.service'

@Injectable()
export class SearchAgentesHandler {
  constructor(private readonly useCase: SearchAgentesUseCase) {}

  async handle(input: OffsetInput): Promise<OffsetPaginatedOutput<AgentePrimitiveProps>> {
    return this.useCase.invoke(input)
  }
}
