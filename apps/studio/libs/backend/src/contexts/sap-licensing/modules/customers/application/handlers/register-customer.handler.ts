import { Injectable } from '@nestjs/common'
import { RegisterCustomerInput } from '../dtos/register-customer-input.dto'
import { RegisterCustomerUseCase } from '../use-cases/register-customer-usecase.service'

@Injectable()
export class RegisterCustomerHandler {
  constructor(private readonly useCase: RegisterCustomerUseCase) {}

  async handle(input: RegisterCustomerInput): Promise<void> {
    await this.useCase.invoke(input)
  }
}
