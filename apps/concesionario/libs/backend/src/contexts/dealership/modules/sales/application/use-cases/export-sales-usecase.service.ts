import { Injectable, Optional } from '@nestjs/common'
import { Criteria, UnpaginatedInput } from '../../../../../shared/domain/query/criteria'
import { ExportTooLargeError } from '../../../../../shared/domain/errors'
import { EXPORT_ROW_LIMIT } from '../../../../../shared/infrastructure/export/export-limit'
import { SaleRepository } from '../../domain/sale-repository'
import { SalePrimitiveProps } from '../../domain/sale-types'
import searchSaleConfig from '../config/search-sale-config'

@Injectable()
export class ExportSalesUseCase {
  constructor(
    private readonly saleRepository: SaleRepository,
    @Optional() private readonly rowLimit: number = EXPORT_ROW_LIMIT
  ) {}

  async invoke(input: UnpaginatedInput): Promise<SalePrimitiveProps[]> {
    const { allowedFilters, allowedOrders, searchableFields } = searchSaleConfig
    const criteria = Criteria.fromUnpaginated(
      input,
      allowedFilters as string[],
      allowedOrders as string[],
      searchableFields as string[]
    )

    const total = await this.saleRepository.count(criteria)
    if (total > this.rowLimit) {
      throw new ExportTooLargeError(total, this.rowLimit)
    }

    const sales = await this.saleRepository.matching(criteria)
    return sales.map(sale => sale.toPrimitives())
  }
}
