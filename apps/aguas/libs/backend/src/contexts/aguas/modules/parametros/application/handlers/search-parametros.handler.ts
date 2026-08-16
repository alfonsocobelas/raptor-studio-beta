import { Injectable } from '@nestjs/common'
import { OffsetPaginatedOutput } from '../../../../../shared/application/dtos/search-output.dto'
import { OffsetInput } from '../../../../../shared/domain/query/criteria'
import { ParametroPrimitiveProps } from '../../domain/parametro-types'
import { SearchParametrosUseCase } from '../use-cases/search-parametros-usecase.service'

@Injectable()
export class SearchParametrosHandler {
  constructor(private readonly useCase: SearchParametrosUseCase) {}

  async handle(input: OffsetInput): Promise<OffsetPaginatedOutput<ParametroPrimitiveProps>> {
    return this.useCase.invoke(input)
  }
}
