import { Injectable } from '@nestjs/common'
import { OffsetPaginatedOutput } from '../../../../../shared/application/dtos/search-output.dto'
import { OffsetInput } from '../../../../../shared/domain/query/criteria'
import { GarmentPrimitiveProps } from '../../domain/garment-types'
import { SearchGarmentsUseCase } from '../use-cases/search-garments-usecase.service'

@Injectable()
export class SearchGarmentsHandler {
  constructor(private readonly useCase: SearchGarmentsUseCase) {}

  async handle(input: OffsetInput): Promise<OffsetPaginatedOutput<GarmentPrimitiveProps>> {
    return this.useCase.invoke(input)
  }
}
