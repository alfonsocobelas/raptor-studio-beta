import { Injectable } from '@nestjs/common'
import { OffsetPaginatedOutput } from '../../../../../shared/application/dtos/search-output.dto'
import { Criteria, OffsetInput } from '../../../../../shared/domain/query/criteria'
import { getTotalPages } from '../../../../../shared/utils/pagination'
import { AgenteRepository } from '../../domain/agente-repository'
import { AgentePrimitiveProps } from '../../domain/agente-types'
import searchAgenteConfig from '../config/search-agente-config'

@Injectable()
export class SearchAgentesUseCase {
  constructor(private readonly agenteRepository: AgenteRepository) {}

  async invoke(input: OffsetInput): Promise<OffsetPaginatedOutput<AgentePrimitiveProps>> {
    const { allowedFilters, allowedOrders, searchableFields } = searchAgenteConfig
    const criteria = Criteria.fromOffset(input, allowedFilters, allowedOrders, searchableFields)

    const [agentes, total] = await Promise.all([
      this.agenteRepository.matching(criteria),
      this.agenteRepository.count(criteria)
    ])

    return {
      total,
      page: input.page,
      pageSize: input.pageSize,
      totalPages: getTotalPages({ pageSize: input.pageSize, total }),
      items: agentes.map(agente => agente.toPrimitives())
    }
  }
}
