import { Injectable } from '@nestjs/common'
import { UnpaginatedInput } from '../../../../../shared/domain/query/criteria'
import { GarmentPrimitiveProps } from '../../domain/garment-types'
import { ExportGarmentsUseCase } from '../use-cases/export-garments-usecase.service'

@Injectable()
export class ExportGarmentsHandler {
  constructor(private readonly useCase: ExportGarmentsUseCase) {}

  async handle(input: UnpaginatedInput): Promise<GarmentPrimitiveProps[]> {
    return this.useCase.invoke(input)
  }
}
