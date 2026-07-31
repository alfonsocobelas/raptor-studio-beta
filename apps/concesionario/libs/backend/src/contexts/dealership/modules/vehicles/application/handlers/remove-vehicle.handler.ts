import { Injectable } from '@nestjs/common'
import { RemoveVehicleInput } from '../dtos/remove-vehicle-input.dto'
import { RemoveVehicleUseCase } from '../use-cases/remove-vehicle-usecase.service'

@Injectable()
export class RemoveVehicleHandler {
  constructor(private readonly useCase: RemoveVehicleUseCase) {}

  async handle(input: RemoveVehicleInput): Promise<void> {
    await this.useCase.invoke(input)
  }
}
