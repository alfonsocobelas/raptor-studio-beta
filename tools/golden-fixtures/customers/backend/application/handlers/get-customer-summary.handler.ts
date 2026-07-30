import { Injectable } from '@nestjs/common'
import { CustomerSummaryDto } from '@sap-licenses/shared/domain'
import { GetCustomerSummaryInput } from '../dtos/get-customer-summary-input.dto'
import { GetCustomerSummaryUseCase } from '../use-cases/get-customer-summary-usecase.service'

@Injectable()
export class GetCustomerSummaryHandler {
  constructor(private readonly useCase: GetCustomerSummaryUseCase) {}

  async handle(input: GetCustomerSummaryInput): Promise<CustomerSummaryDto> {
    return this.useCase.invoke(input)
  }
}
