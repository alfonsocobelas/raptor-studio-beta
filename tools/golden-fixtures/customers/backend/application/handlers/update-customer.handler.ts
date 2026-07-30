import { Injectable } from '@nestjs/common'
import { UpdateCustomerInput } from '../dtos/update-customer-input.dto'
import { UpdateCustomerUseCase } from '../use-cases/update-customer-usecase.service'

@Injectable()
export class UpdateCustomerHandler {
  constructor(private readonly useCase: UpdateCustomerUseCase) {}

  async handle(input: UpdateCustomerInput): Promise<void> {
    return this.useCase.invoke(input)
  }
}
