import { Injectable } from '@nestjs/common'
import { OffsetPaginatedOutput } from '../../../../../shared/application/dtos/search-output.dto'
import { Criteria, OffsetInput } from '../../../../../shared/domain/query/criteria'
import { getTotalPages } from '../../../../../shared/utils/pagination'
import { CustomerRepository } from '../../domain/customer-repository'
import { CustomerPrimitiveProps } from '../../domain/customer-types'
import searchCustomerConfig from '../config/search-customer-config'

@Injectable()
export class SearchCustomersUseCase {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async invoke(input: OffsetInput): Promise<OffsetPaginatedOutput<CustomerPrimitiveProps>> {
    const { allowedFilters, allowedOrders, searchableFields } = searchCustomerConfig
    const criteria = Criteria.fromOffset(input, allowedFilters, allowedOrders, searchableFields)

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
