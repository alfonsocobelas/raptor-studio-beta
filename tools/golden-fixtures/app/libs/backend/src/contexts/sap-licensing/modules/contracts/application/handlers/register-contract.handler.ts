import { Injectable } from '@nestjs/common'
import { RegisterContractInput } from '../dtos/register-contract-input.dto'
import { RegisterContractUseCase } from '../use-cases/register-contract-usecase.service'

@Injectable()
export class RegisterContractHandler {
  constructor(private readonly useCase: RegisterContractUseCase) {}

  async handle(input: RegisterContractInput): Promise<void> {
    await this.useCase.invoke(input)
  }
}
