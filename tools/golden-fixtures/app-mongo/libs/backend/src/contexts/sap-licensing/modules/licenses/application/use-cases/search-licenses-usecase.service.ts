import { Injectable } from '@nestjs/common'
import { OffsetPaginatedOutput } from '../../../../../shared/application/dtos/search-output.dto'
import { Criteria, OffsetInput } from '../../../../../shared/domain/query/criteria'
import { getTotalPages } from '../../../../../shared/utils/pagination'
import { LicenseRepository } from '../../domain/license-repository'
import { LicensePrimitiveProps } from '../../domain/license-types'
import searchLicenseConfig from '../config/search-license-config'

@Injectable()
export class SearchLicensesUseCase {
  constructor(private readonly licenseRepository: LicenseRepository) {}

  async invoke(input: OffsetInput): Promise<OffsetPaginatedOutput<LicensePrimitiveProps>> {
    const { allowedFilters, allowedOrders, searchableFields } = searchLicenseConfig
    const criteria = Criteria.fromOffset(input, allowedFilters, allowedOrders, searchableFields)

    const [licenses, total] = await Promise.all([
      this.licenseRepository.matching(criteria),
      this.licenseRepository.count(criteria)
    ])

    return {
      total,
      page: input.page,
      pageSize: input.pageSize,
      totalPages: getTotalPages({ pageSize: input.pageSize, total }),
      items: licenses.map(license => license.toPrimitives())
    }
  }
}
