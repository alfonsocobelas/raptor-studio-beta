import { Injectable } from '@nestjs/common'
import { OffsetPaginatedOutput } from '../../../../../shared/application/dtos/search-output.dto'
import { Criteria, OffsetInput } from '../../../../../shared/domain/query/criteria'
import { getTotalPages } from '../../../../../shared/utils/pagination'
import { ContractRepository } from '../../domain/contract-repository'
import { ContractPrimitiveProps } from '../../domain/contract-types'
import searchContractConfig from '../config/search-contract-config'

@Injectable()
export class SearchContractsUseCase {
  constructor(private readonly contractRepository: ContractRepository) {}

  async invoke(input: OffsetInput): Promise<OffsetPaginatedOutput<ContractPrimitiveProps>> {
    const { allowedFilters, allowedOrders, searchableFields } = searchContractConfig
    const criteria = Criteria.fromOffset(input, allowedFilters, allowedOrders, searchableFields)

    const [contracts, total] = await Promise.all([
      this.contractRepository.matching(criteria),
      this.contractRepository.count(criteria)
    ])

    return {
      total,
      page: input.page,
      pageSize: input.pageSize,
      totalPages: getTotalPages({ pageSize: input.pageSize, total }),
      items: contracts.map(contract => contract.toPrimitives())
    }
  }
}
