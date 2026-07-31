import { Injectable } from '@nestjs/common'
import { OffsetPaginatedOutput } from '../../../../../shared/application/dtos/search-output.dto'
import { Criteria, OffsetInput } from '../../../../../shared/domain/query/criteria'
import { getTotalPages } from '../../../../../shared/utils/pagination'
import { SupplierRepository } from '../../domain/supplier-repository'
import { SupplierPrimitiveProps } from '../../domain/supplier-types'
import searchSupplierConfig from '../config/search-supplier-config'

@Injectable()
export class SearchSuppliersUseCase {
  constructor(private readonly supplierRepository: SupplierRepository) {}

  async invoke(input: OffsetInput): Promise<OffsetPaginatedOutput<SupplierPrimitiveProps>> {
    const { allowedFilters, allowedOrders, searchableFields } = searchSupplierConfig
    const criteria = Criteria.fromOffset(input, allowedFilters, allowedOrders, searchableFields)

    const [suppliers, total] = await Promise.all([
      this.supplierRepository.matching(criteria),
      this.supplierRepository.count(criteria)
    ])

    return {
      total,
      page: input.page,
      pageSize: input.pageSize,
      totalPages: getTotalPages({ pageSize: input.pageSize, total }),
      items: suppliers.map(supplier => supplier.toPrimitives())
    }
  }
}
