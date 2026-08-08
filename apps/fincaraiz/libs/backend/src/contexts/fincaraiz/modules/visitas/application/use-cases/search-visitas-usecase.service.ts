import { Injectable } from '@nestjs/common'
import { OffsetPaginatedOutput } from '../../../../../shared/application/dtos/search-output.dto'
import { Criteria, OffsetInput } from '../../../../../shared/domain/query/criteria'
import { getTotalPages } from '../../../../../shared/utils/pagination'
import { VisitaRepository } from '../../domain/visita-repository'
import { VisitaPrimitiveProps } from '../../domain/visita-types'
import searchVisitaConfig from '../config/search-visita-config'

@Injectable()
export class SearchVisitasUseCase {
  constructor(private readonly visitaRepository: VisitaRepository) {}

  async invoke(input: OffsetInput): Promise<OffsetPaginatedOutput<VisitaPrimitiveProps>> {
    const { allowedFilters, allowedOrders, searchableFields } = searchVisitaConfig
    const criteria = Criteria.fromOffset(input, allowedFilters, allowedOrders, searchableFields)

    const [visitas, total] = await Promise.all([
      this.visitaRepository.matching(criteria),
      this.visitaRepository.count(criteria)
    ])

    return {
      total,
      page: input.page,
      pageSize: input.pageSize,
      totalPages: getTotalPages({ pageSize: input.pageSize, total }),
      items: visitas.map(visita => visita.toPrimitives())
    }
  }
}
