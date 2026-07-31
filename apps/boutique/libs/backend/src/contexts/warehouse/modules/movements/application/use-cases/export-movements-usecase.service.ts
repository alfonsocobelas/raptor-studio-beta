import { Injectable, Optional } from '@nestjs/common'
import { Criteria, UnpaginatedInput } from '../../../../../shared/domain/query/criteria'
import { ExportTooLargeError } from '../../../../../shared/domain/errors'
import { EXPORT_ROW_LIMIT } from '../../../../../shared/infrastructure/export/export-limit'
import { MovementRepository } from '../../domain/movement-repository'
import { MovementPrimitiveProps } from '../../domain/movement-types'
import searchMovementConfig from '../config/search-movement-config'

@Injectable()
export class ExportMovementsUseCase {
  constructor(
    private readonly movementRepository: MovementRepository,
    @Optional() private readonly rowLimit: number = EXPORT_ROW_LIMIT
  ) {}

  async invoke(input: UnpaginatedInput): Promise<MovementPrimitiveProps[]> {
    const { allowedFilters, allowedOrders, searchableFields } = searchMovementConfig
    const criteria = Criteria.fromUnpaginated(
      input,
      allowedFilters as string[],
      allowedOrders as string[],
      searchableFields as string[]
    )

    const total = await this.movementRepository.count(criteria)
    if (total > this.rowLimit) {
      throw new ExportTooLargeError(total, this.rowLimit)
    }

    const movements = await this.movementRepository.matching(criteria)
    return movements.map(movement => movement.toPrimitives())
  }
}
