import { Injectable } from '@nestjs/common'
import { OffsetPaginatedOutput } from '../../../../../shared/application/dtos/search-output.dto'
import { OffsetInput } from '../../../../../shared/domain/query/criteria'
import { PuntoPrimitiveProps } from '../../domain/punto-types'
import { SearchPuntosUseCase } from '../use-cases/search-puntos-usecase.service'

@Injectable()
export class SearchPuntosHandler {
  constructor(private readonly useCase: SearchPuntosUseCase) {}

  async handle(input: OffsetInput): Promise<OffsetPaginatedOutput<PuntoPrimitiveProps>> {
    return this.useCase.invoke(input)
  }
}
