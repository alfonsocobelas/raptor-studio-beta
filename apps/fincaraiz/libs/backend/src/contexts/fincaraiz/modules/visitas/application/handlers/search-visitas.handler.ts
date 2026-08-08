import { Injectable } from '@nestjs/common'
import { OffsetPaginatedOutput } from '../../../../../shared/application/dtos/search-output.dto'
import { OffsetInput } from '../../../../../shared/domain/query/criteria'
import { VisitaPrimitiveProps } from '../../domain/visita-types'
import { SearchVisitasUseCase } from '../use-cases/search-visitas-usecase.service'

@Injectable()
export class SearchVisitasHandler {
  constructor(private readonly useCase: SearchVisitasUseCase) {}

  async handle(input: OffsetInput): Promise<OffsetPaginatedOutput<VisitaPrimitiveProps>> {
    return this.useCase.invoke(input)
  }
}
