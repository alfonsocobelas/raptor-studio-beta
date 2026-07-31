import { Injectable } from '@nestjs/common'
import { OffsetPaginatedOutput } from '../../../../../shared/application/dtos/search-output.dto'
import { OffsetInput } from '../../../../../shared/domain/query/criteria'
import { MovementPrimitiveProps } from '../../domain/movement-types'
import { SearchMovementsUseCase } from '../use-cases/search-movements-usecase.service'

@Injectable()
export class SearchMovementsHandler {
  constructor(private readonly useCase: SearchMovementsUseCase) {}

  async handle(input: OffsetInput): Promise<OffsetPaginatedOutput<MovementPrimitiveProps>> {
    return this.useCase.invoke(input)
  }
}
