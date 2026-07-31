import { Injectable } from '@nestjs/common'
import { UnpaginatedInput } from '../../../../../shared/domain/query/criteria'
import { VehiclePrimitiveProps } from '../../domain/vehicle-types'
import { ExportVehiclesUseCase } from '../use-cases/export-vehicles-usecase.service'

@Injectable()
export class ExportVehiclesHandler {
  constructor(private readonly useCase: ExportVehiclesUseCase) {}

  async handle(input: UnpaginatedInput): Promise<VehiclePrimitiveProps[]> {
    return this.useCase.invoke(input)
  }
}
