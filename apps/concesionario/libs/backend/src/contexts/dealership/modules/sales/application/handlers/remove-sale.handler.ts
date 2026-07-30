import { Injectable } from '@nestjs/common'
import { RemoveSaleInput } from '../dtos/remove-sale-input.dto'
import { RemoveSaleUseCase } from '../use-cases/remove-sale-usecase.service'

@Injectable()
export class RemoveSaleHandler {
  constructor(private readonly useCase: RemoveSaleUseCase) {}

  async handle(input: RemoveSaleInput): Promise<void> {
    await this.useCase.invoke(input)
  }
}
