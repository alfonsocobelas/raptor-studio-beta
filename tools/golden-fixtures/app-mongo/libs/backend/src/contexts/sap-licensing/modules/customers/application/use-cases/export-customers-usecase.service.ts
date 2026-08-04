import { Injectable, Optional } from '@nestjs/common'
import { Criteria, UnpaginatedInput } from '../../../../../shared/domain/query/criteria'
import { ExportTooLargeError } from '../../../../../shared/domain/errors'
import { EXPORT_ROW_LIMIT } from '../../../../../shared/infrastructure/export/export-limit'
import { CustomerRepository } from '../../domain/customer-repository'
import { CustomerPrimitiveProps } from '../../domain/customer-types'
import searchCustomerConfig from '../config/search-customer-config'

@Injectable()
export class ExportCustomersUseCase {
  constructor(
    private readonly customerRepository: CustomerRepository,
    @Optional() private readonly rowLimit: number = EXPORT_ROW_LIMIT
  ) {}

  async invoke(input: UnpaginatedInput): Promise<CustomerPrimitiveProps[]> {
    const { allowedFilters, allowedOrders, searchableFields } = searchCustomerConfig
    const criteria = Criteria.fromUnpaginated(
      input,
      allowedFilters as string[],
      allowedOrders as string[],
      searchableFields as string[]
    )

    const total = await this.customerRepository.count(criteria)
    if (total > this.rowLimit) {
      throw new ExportTooLargeError(total, this.rowLimit)
    }

    const customers = await this.customerRepository.matching(criteria)
    return customers.map(customer => customer.toPrimitives())
  }
}
