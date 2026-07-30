import { Injectable } from '@nestjs/common'
import { OffsetPaginatedOutput } from '../../../../../shared/application/dtos/search-output.dto'
import { Criteria, OffsetInput } from '../../../../../shared/domain/query/criteria'
import { getTotalPages } from '../../../../../shared/utils/pagination'
import { ContractLicenseValueReader } from '../../domain/contract-license-value-reader'
import { ContractRepository } from '../../domain/contract-repository'
import { ContractView } from '../../domain/contract-types'
import searchContractConfig from '../config/search-contract-config'

@Injectable()
export class SearchContractsUseCase {
  constructor(
    private readonly contractRepository: ContractRepository,
    private readonly licenseValueReader: ContractLicenseValueReader
  ) {}

  async invoke(input: OffsetInput): Promise<OffsetPaginatedOutput<ContractView>> {
    const { allowedFilters, allowedOrders, searchableFields } = searchContractConfig
    const criteria = Criteria.fromOffset(input, allowedFilters, allowedOrders, searchableFields)

    const [contracts, total] = await Promise.all([
      this.contractRepository.matching(criteria),
      this.contractRepository.count(criteria)
    ])

    // Valor derivado (spec 40): una query extra por página (sin N+1)
    const totalValues = await this.licenseValueReader.totalValueByContractIds(
      contracts.map(contract => contract.id.value)
    )

    return {
      total,
      page: input.page,
      pageSize: input.pageSize,
      totalPages: getTotalPages({ pageSize: input.pageSize, total }),
      items: contracts.map(contract => {
        const primitives = contract.toPrimitives()
        // Sin licencias → null (no 0): distingue "sin licencias" de "vale 0"
        return { ...primitives, totalValue: totalValues[primitives.id] ?? null }
      })
    }
  }
}
