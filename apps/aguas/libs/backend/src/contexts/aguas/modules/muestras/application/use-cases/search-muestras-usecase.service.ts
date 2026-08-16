import { Injectable } from '@nestjs/common'
import { OffsetPaginatedOutput } from '../../../../../shared/application/dtos/search-output.dto'
import { Criteria, OffsetInput } from '../../../../../shared/domain/query/criteria'
import { getTotalPages } from '../../../../../shared/utils/pagination'
import { MuestraRepository } from '../../domain/muestra-repository'
import { MuestraPrimitiveProps } from '../../domain/muestra-types'
import searchMuestraConfig from '../config/search-muestra-config'

@Injectable()
export class SearchMuestrasUseCase {
  constructor(private readonly muestraRepository: MuestraRepository) {}

  async invoke(input: OffsetInput): Promise<OffsetPaginatedOutput<MuestraPrimitiveProps>> {
    const { allowedFilters, allowedOrders, searchableFields } = searchMuestraConfig
    const criteria = Criteria.fromOffset(input, allowedFilters, allowedOrders, searchableFields)

    const [muestras, total] = await Promise.all([
      this.muestraRepository.matching(criteria),
      this.muestraRepository.count(criteria)
    ])

    return {
      total,
      page: input.page,
      pageSize: input.pageSize,
      totalPages: getTotalPages({ pageSize: input.pageSize, total }),
      items: muestras.map(muestra => muestra.toPrimitives())
    }
  }
}
