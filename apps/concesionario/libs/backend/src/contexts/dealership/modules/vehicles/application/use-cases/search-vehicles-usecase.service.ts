import { Injectable } from '@nestjs/common'
import { OffsetPaginatedOutput } from '../../../../../shared/application/dtos/search-output.dto'
import { Criteria, OffsetInput } from '../../../../../shared/domain/query/criteria'
import { getTotalPages } from '../../../../../shared/utils/pagination'
import { VehicleRepository } from '../../domain/vehicle-repository'
import { VehiclePrimitiveProps } from '../../domain/vehicle-types'
import searchVehicleConfig from '../config/search-vehicle-config'

@Injectable()
export class SearchVehiclesUseCase {
  constructor(private readonly vehicleRepository: VehicleRepository) {}

  async invoke(input: OffsetInput): Promise<OffsetPaginatedOutput<VehiclePrimitiveProps>> {
    const { allowedFilters, allowedOrders, searchableFields } = searchVehicleConfig
    const criteria = Criteria.fromOffset(input, allowedFilters, allowedOrders, searchableFields)

    const [vehicles, total] = await Promise.all([
      this.vehicleRepository.matching(criteria),
      this.vehicleRepository.count(criteria)
    ])

    return {
      total,
      page: input.page,
      pageSize: input.pageSize,
      totalPages: getTotalPages({ pageSize: input.pageSize, total }),
      items: vehicles.map(vehicle => vehicle.toPrimitives())
    }
  }
}
