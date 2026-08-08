import { Injectable, Optional } from '@nestjs/common'
import { Criteria, UnpaginatedInput } from '../../../../../shared/domain/query/criteria'
import { ExportTooLargeError } from '../../../../../shared/domain/errors'
import { EXPORT_ROW_LIMIT } from '../../../../../shared/infrastructure/export/export-limit'
import { PropiedadRepository } from '../../domain/propiedad-repository'
import { PropiedadPrimitiveProps } from '../../domain/propiedad-types'
import searchPropiedadConfig from '../config/search-propiedad-config'

@Injectable()
export class ExportPropiedadesUseCase {
  constructor(
    private readonly propiedadRepository: PropiedadRepository,
    @Optional() private readonly rowLimit: number = EXPORT_ROW_LIMIT
  ) {}

  async invoke(input: UnpaginatedInput): Promise<PropiedadPrimitiveProps[]> {
    const { allowedFilters, allowedOrders, searchableFields } = searchPropiedadConfig
    const criteria = Criteria.fromUnpaginated(
      input,
      allowedFilters as string[],
      allowedOrders as string[],
      searchableFields as string[]
    )

    const total = await this.propiedadRepository.count(criteria)
    if (total > this.rowLimit) {
      throw new ExportTooLargeError(total, this.rowLimit)
    }

    const propiedades = await this.propiedadRepository.matching(criteria)
    return propiedades.map(propiedad => propiedad.toPrimitives())
  }
}
