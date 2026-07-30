import { Injectable } from '@nestjs/common'
import { CustomerDetailDto } from '@sap-licenses/shared/domain'
import { GetCustomerInput } from '../dtos/get-customer-input.dto'
import { GetCustomerUseCase } from '../use-cases/get-customer-usecase.service'

@Injectable()
export class GetCustomerHandler {
  constructor(private readonly useCase: GetCustomerUseCase) {}

  async handle(input: GetCustomerInput): Promise<CustomerDetailDto> {
    return this.useCase.invoke(input)
  }
}
