import { Injectable } from '@nestjs/common'
import { OffsetPaginatedOutput } from '../../../../../shared/application/dtos/search-output.dto'
import { OffsetInput } from '../../../../../shared/domain/query/criteria'
import { VehiclePrimitiveProps } from '../../domain/vehicle-types'
import { SearchVehiclesUseCase } from '../use-cases/search-vehicles-usecase.service'

@Injectable()
export class SearchVehiclesHandler {
  constructor(private readonly useCase: SearchVehiclesUseCase) {}

  async handle(input: OffsetInput): Promise<OffsetPaginatedOutput<VehiclePrimitiveProps>> {
    return this.useCase.invoke(input)
  }
}
