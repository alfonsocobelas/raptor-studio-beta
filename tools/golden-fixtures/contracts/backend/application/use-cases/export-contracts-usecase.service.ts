import { Injectable, Optional } from '@nestjs/common'
import { Criteria, UnpaginatedInput } from '../../../../../shared/domain/query/criteria'
import { ExportTooLargeError } from '../../../../../shared/domain/errors'
import { EXPORT_ROW_LIMIT } from '../../../../../shared/infrastructure/export/export-limit'
import { ContractRepository } from '../../domain/contract-repository'
import { ContractPrimitiveProps } from '../../domain/contract-types'
import searchContractConfig from '../config/search-contract-config'

@Injectable()
export class ExportContractsUseCase {
  constructor(
    private readonly contractRepository: ContractRepository,
    @Optional() private readonly rowLimit: number = EXPORT_ROW_LIMIT
  ) {}

  async invoke(input: UnpaginatedInput): Promise<ContractPrimitiveProps[]> {
    const { allowedFilters, allowedOrders, searchableFields } = searchContractConfig
    const criteria = Criteria.fromUnpaginated(input, allowedFilters, allowedOrders, searchableFields)

    const total = await this.contractRepository.count(criteria)

    if (total > this.rowLimit) {
      throw new ExportTooLargeError(total, this.rowLimit)
    }

    const contracts = await this.contractRepository.matching(criteria)
    return contracts.map(contract => contract.toPrimitives())
  }
}
