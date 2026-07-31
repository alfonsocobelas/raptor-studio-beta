import { Injectable, Optional } from '@nestjs/common'
import { Criteria, UnpaginatedInput } from '../../../../../shared/domain/query/criteria'
import { ExportTooLargeError } from '../../../../../shared/domain/errors'
import { EXPORT_ROW_LIMIT } from '../../../../../shared/infrastructure/export/export-limit'
import { VehicleRepository } from '../../domain/vehicle-repository'
import { VehiclePrimitiveProps } from '../../domain/vehicle-types'
import searchVehicleConfig from '../config/search-vehicle-config'

@Injectable()
export class ExportVehiclesUseCase {
  constructor(
    private readonly vehicleRepository: VehicleRepository,
    @Optional() private readonly rowLimit: number = EXPORT_ROW_LIMIT
  ) {}

  async invoke(input: UnpaginatedInput): Promise<VehiclePrimitiveProps[]> {
    const { allowedFilters, allowedOrders, searchableFields } = searchVehicleConfig
    const criteria = Criteria.fromUnpaginated(
      input,
      allowedFilters as string[],
      allowedOrders as string[],
      searchableFields as string[]
    )

    const total = await this.vehicleRepository.count(criteria)
    if (total > this.rowLimit) {
      throw new ExportTooLargeError(total, this.rowLimit)
    }

    const vehicles = await this.vehicleRepository.matching(criteria)
    return vehicles.map(vehicle => vehicle.toPrimitives())
  }
}
