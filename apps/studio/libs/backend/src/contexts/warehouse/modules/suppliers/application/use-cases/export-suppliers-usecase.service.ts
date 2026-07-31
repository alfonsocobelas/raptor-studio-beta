import { Injectable, Optional } from '@nestjs/common'
import { Criteria, UnpaginatedInput } from '../../../../../shared/domain/query/criteria'
import { ExportTooLargeError } from '../../../../../shared/domain/errors'
import { EXPORT_ROW_LIMIT } from '../../../../../shared/infrastructure/export/export-limit'
import { SupplierRepository } from '../../domain/supplier-repository'
import { SupplierPrimitiveProps } from '../../domain/supplier-types'
import searchSupplierConfig from '../config/search-supplier-config'

@Injectable()
export class ExportSuppliersUseCase {
  constructor(
    private readonly supplierRepository: SupplierRepository,
    @Optional() private readonly rowLimit: number = EXPORT_ROW_LIMIT
  ) {}

  async invoke(input: UnpaginatedInput): Promise<SupplierPrimitiveProps[]> {
    const { allowedFilters, allowedOrders, searchableFields } = searchSupplierConfig
    const criteria = Criteria.fromUnpaginated(
      input,
      allowedFilters as string[],
      allowedOrders as string[],
      searchableFields as string[]
    )

    const total = await this.supplierRepository.count(criteria)
    if (total > this.rowLimit) {
      throw new ExportTooLargeError(total, this.rowLimit)
    }

    const suppliers = await this.supplierRepository.matching(criteria)
    return suppliers.map(supplier => supplier.toPrimitives())
  }
}
