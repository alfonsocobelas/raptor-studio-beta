import { Injectable } from '@nestjs/common'
import { RemoveGarmentInput } from '../dtos/remove-garment-input.dto'
import { RemoveGarmentUseCase } from '../use-cases/remove-garment-usecase.service'

@Injectable()
export class RemoveGarmentHandler {
  constructor(private readonly useCase: RemoveGarmentUseCase) {}

  async handle(input: RemoveGarmentInput): Promise<void> {
    await this.useCase.invoke(input)
  }
}
