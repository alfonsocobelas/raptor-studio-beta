import { Injectable, Optional } from '@nestjs/common'
import { Criteria, UnpaginatedInput } from '../../../../../shared/domain/query/criteria'
import { ExportTooLargeError } from '../../../../../shared/domain/errors'
import { EXPORT_ROW_LIMIT } from '../../../../../shared/infrastructure/export/export-limit'
import { LicenseRepository } from '../../domain/license-repository'
import { LicensePrimitiveProps } from '../../domain/license-types'
import searchLicenseConfig from '../config/search-license-config'

@Injectable()
export class ExportLicensesUseCase {
  constructor(
    private readonly licenseRepository: LicenseRepository,
    @Optional() private readonly rowLimit: number = EXPORT_ROW_LIMIT
  ) {}

  async invoke(input: UnpaginatedInput): Promise<LicensePrimitiveProps[]> {
    const { allowedFilters, allowedOrders, searchableFields } = searchLicenseConfig
    const criteria = Criteria.fromUnpaginated(
      input,
      allowedFilters as string[],
      allowedOrders as string[],
      searchableFields as string[]
    )

    const total = await this.licenseRepository.count(criteria)
    if (total > this.rowLimit) {
      throw new ExportTooLargeError(total, this.rowLimit)
    }

    const licenses = await this.licenseRepository.matching(criteria)
    return licenses.map(license => license.toPrimitives())
  }
}
