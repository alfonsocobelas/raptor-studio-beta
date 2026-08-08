import { Injectable } from '@nestjs/common'
import { UnpaginatedInput } from '../../../../../shared/domain/query/criteria'
import { AgentePrimitiveProps } from '../../domain/agente-types'
import { ExportAgentesUseCase } from '../use-cases/export-agentes-usecase.service'

@Injectable()
export class ExportAgentesHandler {
  constructor(private readonly useCase: ExportAgentesUseCase) {}

  async handle(input: UnpaginatedInput): Promise<AgentePrimitiveProps[]> {
    return this.useCase.invoke(input)
  }
}
