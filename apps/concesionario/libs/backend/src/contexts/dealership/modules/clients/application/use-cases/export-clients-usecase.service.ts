import { Injectable, Optional } from '@nestjs/common'
import { Criteria, UnpaginatedInput } from '../../../../../shared/domain/query/criteria'
import { ExportTooLargeError } from '../../../../../shared/domain/errors'
import { EXPORT_ROW_LIMIT } from '../../../../../shared/infrastructure/export/export-limit'
import { ClientRepository } from '../../domain/client-repository'
import { ClientPrimitiveProps } from '../../domain/client-types'
import searchClientConfig from '../config/search-client-config'

@Injectable()
export class ExportClientsUseCase {
  constructor(
    private readonly clientRepository: ClientRepository,
    @Optional() private readonly rowLimit: number = EXPORT_ROW_LIMIT
  ) {}

  async invoke(input: UnpaginatedInput): Promise<ClientPrimitiveProps[]> {
    const { allowedFilters, allowedOrders, searchableFields } = searchClientConfig
    const criteria = Criteria.fromUnpaginated(
      input,
      allowedFilters as string[],
      allowedOrders as string[],
      searchableFields as string[]
    )

    const total = await this.clientRepository.count(criteria)
    if (total > this.rowLimit) {
      throw new ExportTooLargeError(total, this.rowLimit)
    }

    const clients = await this.clientRepository.matching(criteria)
    return clients.map(client => client.toPrimitives())
  }
}
