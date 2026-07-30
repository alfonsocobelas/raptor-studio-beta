import { Injectable } from '@nestjs/common'
import { GetCustomerInput } from '../dtos/get-customer-input.dto'
import { GetCustomerUseCase, CustomerDetailOutput } from '../use-cases/get-customer-usecase.service'

@Injectable()
export class GetCustomerHandler {
  constructor(private readonly useCase: GetCustomerUseCase) {}

  async handle(input: GetCustomerInput): Promise<CustomerDetailOutput> {
    return this.useCase.invoke(input)
  }
}
