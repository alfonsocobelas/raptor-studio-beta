import { Injectable } from '@nestjs/common'
import { UpdateSaleInput } from '../dtos/update-sale-input.dto'
import { UpdateSaleUseCase } from '../use-cases/update-sale-usecase.service'

@Injectable()
export class UpdateSaleHandler {
  constructor(private readonly useCase: UpdateSaleUseCase) {}

  async handle(input: UpdateSaleInput): Promise<void> {
    await this.useCase.invoke(input)
  }
}
