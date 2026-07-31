import { Injectable } from '@nestjs/common'
import { OffsetPaginatedOutput } from '../../../../../shared/application/dtos/search-output.dto'
import { Criteria, OffsetInput } from '../../../../../shared/domain/query/criteria'
import { getTotalPages } from '../../../../../shared/utils/pagination'
import { GarmentRepository } from '../../domain/garment-repository'
import { GarmentPrimitiveProps } from '../../domain/garment-types'
import searchGarmentConfig from '../config/search-garment-config'

@Injectable()
export class SearchGarmentsUseCase {
  constructor(private readonly garmentRepository: GarmentRepository) {}

  async invoke(input: OffsetInput): Promise<OffsetPaginatedOutput<GarmentPrimitiveProps>> {
    const { allowedFilters, allowedOrders, searchableFields } = searchGarmentConfig
    const criteria = Criteria.fromOffset(input, allowedFilters, allowedOrders, searchableFields)

    const [garments, total] = await Promise.all([
      this.garmentRepository.matching(criteria),
      this.garmentRepository.count(criteria)
    ])

    return {
      total,
      page: input.page,
      pageSize: input.pageSize,
      totalPages: getTotalPages({ pageSize: input.pageSize, total }),
      items: garments.map(garment => garment.toPrimitives())
    }
  }
}
