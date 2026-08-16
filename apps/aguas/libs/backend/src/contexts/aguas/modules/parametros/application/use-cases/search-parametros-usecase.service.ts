import { Injectable } from '@nestjs/common'
import { OffsetPaginatedOutput } from '../../../../../shared/application/dtos/search-output.dto'
import { Criteria, OffsetInput } from '../../../../../shared/domain/query/criteria'
import { getTotalPages } from '../../../../../shared/utils/pagination'
import { ParametroRepository } from '../../domain/parametro-repository'
import { ParametroPrimitiveProps } from '../../domain/parametro-types'
import searchParametroConfig from '../config/search-parametro-config'

@Injectable()
export class SearchParametrosUseCase {
  constructor(private readonly parametroRepository: ParametroRepository) {}

  async invoke(input: OffsetInput): Promise<OffsetPaginatedOutput<ParametroPrimitiveProps>> {
    const { allowedFilters, allowedOrders, searchableFields } = searchParametroConfig
    const criteria = Criteria.fromOffset(input, allowedFilters, allowedOrders, searchableFields)

    const [parametros, total] = await Promise.all([
      this.parametroRepository.matching(criteria),
      this.parametroRepository.count(criteria)
    ])

    return {
      total,
      page: input.page,
      pageSize: input.pageSize,
      totalPages: getTotalPages({ pageSize: input.pageSize, total }),
      items: parametros.map(parametro => parametro.toPrimitives())
    }
  }
}
