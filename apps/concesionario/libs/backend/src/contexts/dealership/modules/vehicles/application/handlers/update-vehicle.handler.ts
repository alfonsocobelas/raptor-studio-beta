import { Injectable } from '@nestjs/common'
import { UpdateVehicleInput } from '../dtos/update-vehicle-input.dto'
import { UpdateVehicleUseCase } from '../use-cases/update-vehicle-usecase.service'

@Injectable()
export class UpdateVehicleHandler {
  constructor(private readonly useCase: UpdateVehicleUseCase) {}

  async handle(input: UpdateVehicleInput): Promise<void> {
    await this.useCase.invoke(input)
  }
}
