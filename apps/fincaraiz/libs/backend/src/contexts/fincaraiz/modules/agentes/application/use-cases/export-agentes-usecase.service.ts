import { Injectable, Optional } from '@nestjs/common'
import { Criteria, UnpaginatedInput } from '../../../../../shared/domain/query/criteria'
import { ExportTooLargeError } from '../../../../../shared/domain/errors'
import { EXPORT_ROW_LIMIT } from '../../../../../shared/infrastructure/export/export-limit'
import { AgenteRepository } from '../../domain/agente-repository'
import { AgentePrimitiveProps } from '../../domain/agente-types'
import searchAgenteConfig from '../config/search-agente-config'

@Injectable()
export class ExportAgentesUseCase {
  constructor(
    private readonly agenteRepository: AgenteRepository,
    @Optional() private readonly rowLimit: number = EXPORT_ROW_LIMIT
  ) {}

  async invoke(input: UnpaginatedInput): Promise<AgentePrimitiveProps[]> {
    const { allowedFilters, allowedOrders, searchableFields } = searchAgenteConfig
    const criteria = Criteria.fromUnpaginated(
      input,
      allowedFilters as string[],
      allowedOrders as string[],
      searchableFields as string[]
    )

    const total = await this.agenteRepository.count(criteria)
    if (total > this.rowLimit) {
      throw new ExportTooLargeError(total, this.rowLimit)
    }

    const agentes = await this.agenteRepository.matching(criteria)
    return agentes.map(agente => agente.toPrimitives())
  }
}
