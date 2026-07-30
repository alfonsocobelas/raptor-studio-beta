import { Injectable } from '@nestjs/common'
import { OffsetInput } from '../../../../../shared/domain/query/criteria'
import { OffsetPaginatedOutput } from '../../../../../shared/application/dtos/search-output.dto'
import { getTotalPages } from '../../../../../shared/utils/pagination'
import { CustomerRepository } from '../../domain/customer-repository'
import { CustomerPrimitiveProps } from '../../domain/customer-types'
import searchCustomerConfig from '../config/search-customer-config'
import { Criteria } from '../../../../../shared/domain/query/criteria'
import { activeCustomersFilter } from '../../domain/specifications/customer-active-status.filter'
import { SearchCustomersOptions } from '../dtos/search-customers-input.dto'

export type CustomerListItem = CustomerPrimitiveProps

@Injectable()
export class SearchCustomersUseCase {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async invoke(
    input: OffsetInput,
    options: SearchCustomersOptions = {}
  ): Promise<OffsetPaginatedOutput<CustomerListItem>> {
    const { allowedFilters, allowedOrders, searchableFields } = searchCustomerConfig
    const baseCriteria = Criteria.fromOffset(input, allowedFilters, allowedOrders, searchableFields)
    // Por defecto solo activos; los archivados (spec 32) solo se incluyen si el cliente lo pide
    const criteria = options.includeArchived ? baseCriteria : baseCriteria.withAdditionalFilter(activeCustomersFilter())

    const [customers, total] = await Promise.all([
      this.customerRepository.matching(criteria),
      this.customerRepository.count(criteria)
    ])

    return {
      total,
      page: input.page,
      pageSize: input.pageSize,
      totalPages: getTotalPages({ pageSize: input.pageSize, total }),
      items: customers.map(customer => customer.toPrimitives())
    }
  }
}
