import { Injectable } from '@nestjs/common'
import { GetSupplierInput } from '../dtos/get-supplier-input.dto'
import { GetSupplierUseCase } from '../use-cases/get-supplier-usecase.service'
import { SupplierPrimitiveProps } from '../../domain/supplier-types'

@Injectable()
export class GetSupplierHandler {
  constructor(private readonly useCase: GetSupplierUseCase) {}

  async handle(input: GetSupplierInput): Promise<SupplierPrimitiveProps> {
    return this.useCase.invoke(input)
  }
}
