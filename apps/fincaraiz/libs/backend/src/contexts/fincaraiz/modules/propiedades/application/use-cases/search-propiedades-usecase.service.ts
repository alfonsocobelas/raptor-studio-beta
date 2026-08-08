import { Injectable } from '@nestjs/common'
import { OffsetPaginatedOutput } from '../../../../../shared/application/dtos/search-output.dto'
import { Criteria, OffsetInput } from '../../../../../shared/domain/query/criteria'
import { getTotalPages } from '../../../../../shared/utils/pagination'
import { PropiedadRepository } from '../../domain/propiedad-repository'
import { PropiedadPrimitiveProps } from '../../domain/propiedad-types'
import searchPropiedadConfig from '../config/search-propiedad-config'

@Injectable()
export class SearchPropiedadesUseCase {
  constructor(private readonly propiedadRepository: PropiedadRepository) {}

  async invoke(input: OffsetInput): Promise<OffsetPaginatedOutput<PropiedadPrimitiveProps>> {
    const { allowedFilters, allowedOrders, searchableFields } = searchPropiedadConfig
    const criteria = Criteria.fromOffset(input, allowedFilters, allowedOrders, searchableFields)

    const [propiedades, total] = await Promise.all([
      this.propiedadRepository.matching(criteria),
      this.propiedadRepository.count(criteria)
    ])

    return {
      total,
      page: input.page,
      pageSize: input.pageSize,
      totalPages: getTotalPages({ pageSize: input.pageSize, total }),
      items: propiedades.map(propiedad => propiedad.toPrimitives())
    }
  }
}
