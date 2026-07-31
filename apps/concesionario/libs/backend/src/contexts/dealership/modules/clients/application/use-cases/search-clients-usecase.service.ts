import { Injectable } from '@nestjs/common'
import { OffsetPaginatedOutput } from '../../../../../shared/application/dtos/search-output.dto'
import { Criteria, OffsetInput } from '../../../../../shared/domain/query/criteria'
import { getTotalPages } from '../../../../../shared/utils/pagination'
import { ClientRepository } from '../../domain/client-repository'
import { ClientPrimitiveProps } from '../../domain/client-types'
import searchClientConfig from '../config/search-client-config'

@Injectable()
export class SearchClientsUseCase {
  constructor(private readonly clientRepository: ClientRepository) {}

  async invoke(input: OffsetInput): Promise<OffsetPaginatedOutput<ClientPrimitiveProps>> {
    const { allowedFilters, allowedOrders, searchableFields } = searchClientConfig
    const criteria = Criteria.fromOffset(input, allowedFilters, allowedOrders, searchableFields)

    const [clients, total] = await Promise.all([
      this.clientRepository.matching(criteria),
      this.clientRepository.count(criteria)
    ])

    return {
      total,
      page: input.page,
      pageSize: input.pageSize,
      totalPages: getTotalPages({ pageSize: input.pageSize, total }),
      items: clients.map(client => client.toPrimitives())
    }
  }
}
