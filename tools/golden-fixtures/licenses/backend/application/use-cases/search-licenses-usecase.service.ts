import { Injectable } from '@nestjs/common'
import { OffsetPaginatedOutput } from '../../../../../shared/application/dtos/search-output.dto'
import { Criteria } from '../../../../../shared/domain/query/criteria'
import { getTotalPages } from '../../../../../shared/utils/pagination'
import { LicenseRepository } from '../../domain/license-repository'
import { LicenseWithConsumption } from '../../domain/license-types'
import searchLicenseConfig from '../config/search-license-config'
import { SearchLicensesInput } from '../dtos/search-licenses-input.dto'
import { healthToCriteriaFilters } from '../factories/health-to-criteria-filters'
import { toLicenseReadModel } from '../factories/license-enrichment'
import { resolveLicenseFilterAliases, resolveLicenseOrderAliases } from '../factories/license-order-alias'

// Camino único Criteria/SQL (spec 26): el snapshot de consumo vive en columnas, así que la salud
// se traduce a un rango de consumptionPct y la BD filtra, ordena y pagina — sin parque en memoria.
@Injectable()
export class SearchLicensesUseCase {
  constructor(private readonly licenseRepository: LicenseRepository) {}

  async invoke(input: SearchLicensesInput): Promise<OffsetPaginatedOutput<LicenseWithConsumption>> {
    const { allowedFilters, allowedOrders, searchableFields } = searchLicenseConfig
    const criteria = Criteria.fromOffset(
      {
        ...input,
        filters: [
          ...(resolveLicenseFilterAliases(input.filters) ?? []),
          ...healthToCriteriaFilters(input.health ?? [])
        ],
        orders: resolveLicenseOrderAliases(input.orders)
      },
      allowedFilters,
      allowedOrders,
      searchableFields
    )

    const [licenses, total] = await Promise.all([
      this.licenseRepository.matching(criteria),
      this.licenseRepository.count(criteria)
    ])

    return {
      total,
      page: input.page,
      pageSize: input.pageSize,
      totalPages: getTotalPages({ pageSize: input.pageSize, total }),
      items: licenses.map(license => toLicenseReadModel(license.toPrimitives()))
    }
  }
}
