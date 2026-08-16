import { Injectable, Optional } from '@nestjs/common'
import { Criteria, UnpaginatedInput } from '../../../../../shared/domain/query/criteria'
import { ExportTooLargeError } from '../../../../../shared/domain/errors'
import { EXPORT_ROW_LIMIT } from '../../../../../shared/infrastructure/export/export-limit'
import { ClienteRepository } from '../../domain/cliente-repository'
import { ClientePrimitiveProps } from '../../domain/cliente-types'
import searchClienteConfig from '../config/search-cliente-config'

@Injectable()
export class ExportClientesUseCase {
  constructor(
    private readonly clienteRepository: ClienteRepository,
    @Optional() private readonly rowLimit: number = EXPORT_ROW_LIMIT
  ) {}

  async invoke(input: UnpaginatedInput): Promise<ClientePrimitiveProps[]> {
    const { allowedFilters, allowedOrders, searchableFields } = searchClienteConfig
    const criteria = Criteria.fromUnpaginated(
      input,
      allowedFilters as string[],
      allowedOrders as string[],
      searchableFields as string[]
    )

    const total = await this.clienteRepository.count(criteria)
    if (total > this.rowLimit) {
      throw new ExportTooLargeError(total, this.rowLimit)
    }

    const clientes = await this.clienteRepository.matching(criteria)
    return clientes.map(cliente => cliente.toPrimitives())
  }
}
