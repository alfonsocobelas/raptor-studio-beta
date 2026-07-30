import { Injectable } from '@nestjs/common'
import { RegisterSupplierInput } from '../dtos/register-supplier-input.dto'
import { RegisterSupplierUseCase } from '../use-cases/register-supplier-usecase.service'

@Injectable()
export class RegisterSupplierHandler {
  constructor(private readonly useCase: RegisterSupplierUseCase) {}

  async handle(input: RegisterSupplierInput): Promise<void> {
    await this.useCase.invoke(input)
  }
}
