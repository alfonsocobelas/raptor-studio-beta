import { Injectable } from '@nestjs/common'
import { OffsetPaginatedOutput } from '../../../../../shared/application/dtos/search-output.dto'
import { Criteria, OffsetInput } from '../../../../../shared/domain/query/criteria'
import { getTotalPages } from '../../../../../shared/utils/pagination'
import { SaleRepository } from '../../domain/sale-repository'
import { SalePrimitiveProps } from '../../domain/sale-types'
import searchSaleConfig from '../config/search-sale-config'

@Injectable()
export class SearchSalesUseCase {
  constructor(private readonly saleRepository: SaleRepository) {}

  async invoke(input: OffsetInput): Promise<OffsetPaginatedOutput<SalePrimitiveProps>> {
    const { allowedFilters, allowedOrders, searchableFields } = searchSaleConfig
    const criteria = Criteria.fromOffset(input, allowedFilters, allowedOrders, searchableFields)

    const [sales, total] = await Promise.all([
      this.saleRepository.matching(criteria),
      this.saleRepository.count(criteria)
    ])

    return {
      total,
      page: input.page,
      pageSize: input.pageSize,
      totalPages: getTotalPages({ pageSize: input.pageSize, total }),
      items: sales.map(sale => sale.toPrimitives())
    }
  }
}
