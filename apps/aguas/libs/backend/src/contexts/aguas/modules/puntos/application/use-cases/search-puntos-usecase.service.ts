import { Injectable } from '@nestjs/common'
import { OffsetPaginatedOutput } from '../../../../../shared/application/dtos/search-output.dto'
import { Criteria, OffsetInput } from '../../../../../shared/domain/query/criteria'
import { getTotalPages } from '../../../../../shared/utils/pagination'
import { PuntoRepository } from '../../domain/punto-repository'
import { PuntoPrimitiveProps } from '../../domain/punto-types'
import searchPuntoConfig from '../config/search-punto-config'

@Injectable()
export class SearchPuntosUseCase {
  constructor(private readonly puntoRepository: PuntoRepository) {}

  async invoke(input: OffsetInput): Promise<OffsetPaginatedOutput<PuntoPrimitiveProps>> {
    const { allowedFilters, allowedOrders, searchableFields } = searchPuntoConfig
    const criteria = Criteria.fromOffset(input, allowedFilters, allowedOrders, searchableFields)

    const [puntos, total] = await Promise.all([
      this.puntoRepository.matching(criteria),
      this.puntoRepository.count(criteria)
    ])

    return {
      total,
      page: input.page,
      pageSize: input.pageSize,
      totalPages: getTotalPages({ pageSize: input.pageSize, total }),
      items: puntos.map(punto => punto.toPrimitives())
    }
  }
}
