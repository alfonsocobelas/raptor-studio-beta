import { Injectable } from '@nestjs/common'
import { UpdateGarmentInput } from '../dtos/update-garment-input.dto'
import { UpdateGarmentUseCase } from '../use-cases/update-garment-usecase.service'

@Injectable()
export class UpdateGarmentHandler {
  constructor(private readonly useCase: UpdateGarmentUseCase) {}

  async handle(input: UpdateGarmentInput): Promise<void> {
    await this.useCase.invoke(input)
  }
}
