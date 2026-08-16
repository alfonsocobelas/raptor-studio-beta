import { Injectable } from '@nestjs/common'
import { OffsetPaginatedOutput } from '../../../../../shared/application/dtos/search-output.dto'
import { OffsetInput } from '../../../../../shared/domain/query/criteria'
import { ParametroPrimitiveProps } from '../../domain/parametro-types'
import { SearchDeletedParametrosUseCase } from '../use-cases/search-deleted-parametros-usecase.service'

@Injectable()
export class SearchDeletedParametrosHandler {
  constructor(private readonly useCase: SearchDeletedParametrosUseCase) {}

  async handle(input: OffsetInput): Promise<OffsetPaginatedOutput<ParametroPrimitiveProps>> {
    return this.useCase.invoke(input)
  }
}
