import { Injectable } from '@nestjs/common'
import { RegisterSaleInput } from '../dtos/register-sale-input.dto'
import { RegisterSaleUseCase } from '../use-cases/register-sale-usecase.service'

@Injectable()
export class RegisterSaleHandler {
  constructor(private readonly useCase: RegisterSaleUseCase) {}

  async handle(input: RegisterSaleInput): Promise<void> {
    await this.useCase.invoke(input)
  }
}
