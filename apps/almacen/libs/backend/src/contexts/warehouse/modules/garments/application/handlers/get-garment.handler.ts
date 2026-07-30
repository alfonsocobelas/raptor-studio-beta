import { Injectable } from '@nestjs/common'
import { GetGarmentInput } from '../dtos/get-garment-input.dto'
import { GetGarmentUseCase } from '../use-cases/get-garment-usecase.service'
import { GarmentPrimitiveProps } from '../../domain/garment-types'

@Injectable()
export class GetGarmentHandler {
  constructor(private readonly useCase: GetGarmentUseCase) {}

  async handle(input: GetGarmentInput): Promise<GarmentPrimitiveProps> {
    return this.useCase.invoke(input)
  }
}
