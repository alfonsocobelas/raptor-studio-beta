import { Injectable } from '@nestjs/common'
import { GetVehicleInput } from '../dtos/get-vehicle-input.dto'
import { GetVehicleUseCase } from '../use-cases/get-vehicle-usecase.service'
import { VehiclePrimitiveProps } from '../../domain/vehicle-types'

@Injectable()
export class GetVehicleHandler {
  constructor(private readonly useCase: GetVehicleUseCase) {}

  async handle(input: GetVehicleInput): Promise<VehiclePrimitiveProps> {
    return this.useCase.invoke(input)
  }
}
