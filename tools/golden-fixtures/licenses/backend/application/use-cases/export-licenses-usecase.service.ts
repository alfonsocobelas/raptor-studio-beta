import { Injectable, Optional } from '@nestjs/common'
import { Criteria } from '../../../../../shared/domain/query/criteria'
import { ExportTooLargeError } from '../../../../../shared/domain/errors'
import { EXPORT_ROW_LIMIT } from '../../../../../shared/infrastructure/export/export-limit'
import { LicenseRepository } from '../../domain/license-repository'
import { LicenseWithConsumption } from '../../domain/license-types'
import searchLicenseConfig from '../config/search-license-config'
import { ExportLicensesInput } from '../dtos/export-licenses-input.dto'
import { healthToCriteriaFilters } from '../factories/health-to-criteria-filters'
import { toLicenseReadModel } from '../factories/license-enrichment'
import { resolveLicenseFilterAliases, resolveLicenseOrderAliases } from '../factories/license-order-alias'

// Camino único Criteria/SQL (spec 26): también los exports por salud cuentan primero en SQL, así
// que el tope de filas protege en todos los casos sin cargar el parque.
@Injectable()
export class ExportLicensesUseCase {
  constructor(
    private readonly licenseRepository: LicenseRepository,
    @Optional() private readonly rowLimit: number = EXPORT_ROW_LIMIT
  ) {}

  async invoke(input: ExportLicensesInput): Promise<LicenseWithConsumption[]> {
    const { allowedFilters, allowedOrders, searchableFields } = searchLicenseConfig
    const criteria = Criteria.fromUnpaginated(
      {
        ...input,
        filters: [
          ...(resolveLicenseFilterAliases(input.filters) ?? []),
          ...healthToCriteriaFilters(input.health ?? [])
        ],
        orders: resolveLicenseOrderAliases(input.orders)
      },
      allowedFilters as string[],
      allowedOrders as string[],
      searchableFields as string[]
    )

    const total = await this.licenseRepository.count(criteria)

    if (total > this.rowLimit) {
      throw new ExportTooLargeError(total, this.rowLimit)
    }

    const licenses = await this.licenseRepository.matching(criteria)
    return licenses.map(license => toLicenseReadModel(license.toPrimitives()))
  }
}
