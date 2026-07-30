import { Injectable } from '@nestjs/common'
import { RegisterVehicleInput } from '../dtos/register-vehicle-input.dto'
import { RegisterVehicleUseCase } from '../use-cases/register-vehicle-usecase.service'

@Injectable()
export class RegisterVehicleHandler {
  constructor(private readonly useCase: RegisterVehicleUseCase) {}

  async handle(input: RegisterVehicleInput): Promise<void> {
    await this.useCase.invoke(input)
  }
}
