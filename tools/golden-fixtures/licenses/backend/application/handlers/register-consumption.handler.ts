import { Injectable } from '@nestjs/common'
import { RegisterConsumptionInput } from '../dtos/register-consumption-input.dto'
import { RegisterConsumptionUseCase } from '../use-cases/register-consumption-usecase.service'

@Injectable()
export class RegisterConsumptionHandler {
  constructor(private readonly useCase: RegisterConsumptionUseCase) {}

  async handle(input: RegisterConsumptionInput): Promise<void> {
    await this.useCase.invoke(input)
  }
}
