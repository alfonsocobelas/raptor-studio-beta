import { Injectable } from '@nestjs/common'
import { OffsetPaginatedOutput } from '../../../../../shared/application/dtos/search-output.dto'
import { Criteria, OffsetInput } from '../../../../../shared/domain/query/criteria'
import { getTotalPages } from '../../../../../shared/utils/pagination'
import { MovementRepository } from '../../domain/movement-repository'
import { MovementPrimitiveProps } from '../../domain/movement-types'
import searchMovementConfig from '../config/search-movement-config'

@Injectable()
export class SearchMovementsUseCase {
  constructor(private readonly movementRepository: MovementRepository) {}

  async invoke(input: OffsetInput): Promise<OffsetPaginatedOutput<MovementPrimitiveProps>> {
    const { allowedFilters, allowedOrders, searchableFields } = searchMovementConfig
    const criteria = Criteria.fromOffset(input, allowedFilters, allowedOrders, searchableFields)

    const [movements, total] = await Promise.all([
      this.movementRepository.matching(criteria),
      this.movementRepository.count(criteria)
    ])

    return {
      total,
      page: input.page,
      pageSize: input.pageSize,
      totalPages: getTotalPages({ pageSize: input.pageSize, total }),
      items: movements.map(movement => movement.toPrimitives())
    }
  }
}
