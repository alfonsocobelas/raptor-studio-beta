import { Injectable, Optional } from '@nestjs/common'
import { Criteria, UnpaginatedInput } from '../../../../../shared/domain/query/criteria'
import { ExportTooLargeError } from '../../../../../shared/domain/errors'
import { EXPORT_ROW_LIMIT } from '../../../../../shared/infrastructure/export/export-limit'
import { GarmentRepository } from '../../domain/garment-repository'
import { GarmentPrimitiveProps } from '../../domain/garment-types'
import searchGarmentConfig from '../config/search-garment-config'

@Injectable()
export class ExportGarmentsUseCase {
  constructor(
    private readonly garmentRepository: GarmentRepository,
    @Optional() private readonly rowLimit: number = EXPORT_ROW_LIMIT
  ) {}

  async invoke(input: UnpaginatedInput): Promise<GarmentPrimitiveProps[]> {
    const { allowedFilters, allowedOrders, searchableFields } = searchGarmentConfig
    const criteria = Criteria.fromUnpaginated(
      input,
      allowedFilters as string[],
      allowedOrders as string[],
      searchableFields as string[]
    )

    const total = await this.garmentRepository.count(criteria)
    if (total > this.rowLimit) {
      throw new ExportTooLargeError(total, this.rowLimit)
    }

    const garments = await this.garmentRepository.matching(criteria)
    return garments.map(garment => garment.toPrimitives())
  }
}
