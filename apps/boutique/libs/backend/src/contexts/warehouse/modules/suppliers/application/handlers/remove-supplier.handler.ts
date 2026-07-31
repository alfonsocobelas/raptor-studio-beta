import { Injectable } from '@nestjs/common'
import { RemoveSupplierInput } from '../dtos/remove-supplier-input.dto'
import { RemoveSupplierUseCase } from '../use-cases/remove-supplier-usecase.service'

@Injectable()
export class RemoveSupplierHandler {
  constructor(private readonly useCase: RemoveSupplierUseCase) {}

  async handle(input: RemoveSupplierInput): Promise<void> {
    await this.useCase.invoke(input)
  }
}
