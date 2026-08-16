import { Injectable } from '@nestjs/common'
import { OffsetPaginatedOutput } from '../../../../../shared/application/dtos/search-output.dto'
import { Criteria, OffsetInput } from '../../../../../shared/domain/query/criteria'
import { getTotalPages } from '../../../../../shared/utils/pagination'
import { ClienteRepository } from '../../domain/cliente-repository'
import { ClientePrimitiveProps } from '../../domain/cliente-types'
import searchClienteConfig from '../config/search-cliente-config'

// La papelera: el mismo search (config, filtros, paginación), sobre lo soft-borrado.
@Injectable()
export class SearchDeletedClientesUseCase {
  constructor(private readonly clienteRepository: ClienteRepository) {}

  async invoke(input: OffsetInput): Promise<OffsetPaginatedOutput<ClientePrimitiveProps>> {
    const { allowedFilters, allowedOrders, searchableFields } = searchClienteConfig
    const criteria = Criteria.fromOffset(input, allowedFilters, allowedOrders, searchableFields)

    const [clientes, total] = await Promise.all([
      this.clienteRepository.matchingDeleted(criteria),
      this.clienteRepository.countDeleted(criteria)
    ])

    return {
      total,
      page: input.page,
      pageSize: input.pageSize,
      totalPages: getTotalPages({ pageSize: input.pageSize, total }),
      items: clientes.map(cliente => cliente.toPrimitives())
    }
  }
}
