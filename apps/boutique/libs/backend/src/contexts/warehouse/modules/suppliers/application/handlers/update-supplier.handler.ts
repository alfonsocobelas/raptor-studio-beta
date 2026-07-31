import { Injectable } from '@nestjs/common'
import { UpdateSupplierInput } from '../dtos/update-supplier-input.dto'
import { UpdateSupplierUseCase } from '../use-cases/update-supplier-usecase.service'

@Injectable()
export class UpdateSupplierHandler {
  constructor(private readonly useCase: UpdateSupplierUseCase) {}

  async handle(input: UpdateSupplierInput): Promise<void> {
    await this.useCase.invoke(input)
  }
}
