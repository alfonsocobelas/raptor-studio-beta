import { Injectable } from '@nestjs/common'
import { OffsetPaginatedOutput } from '../../../../../shared/application/dtos/search-output.dto'
import { OffsetInput } from '../../../../../shared/domain/query/criteria'
import { PuntoPrimitiveProps } from '../../domain/punto-types'
import { SearchDeletedPuntosUseCase } from '../use-cases/search-deleted-puntos-usecase.service'

@Injectable()
export class SearchDeletedPuntosHandler {
  constructor(private readonly useCase: SearchDeletedPuntosUseCase) {}

  async handle(input: OffsetInput): Promise<OffsetPaginatedOutput<PuntoPrimitiveProps>> {
    return this.useCase.invoke(input)
  }
}
