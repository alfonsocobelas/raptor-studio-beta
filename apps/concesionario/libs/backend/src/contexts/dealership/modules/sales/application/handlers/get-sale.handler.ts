import { Injectable } from '@nestjs/common'
import { GetSaleInput } from '../dtos/get-sale-input.dto'
import { GetSaleUseCase } from '../use-cases/get-sale-usecase.service'
import { SalePrimitiveProps } from '../../domain/sale-types'

@Injectable()
export class GetSaleHandler {
  constructor(private readonly useCase: GetSaleUseCase) {}

  async handle(input: GetSaleInput): Promise<SalePrimitiveProps> {
    return this.useCase.invoke(input)
  }
}
