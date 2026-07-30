import { Injectable } from '@nestjs/common'
import { OffsetPaginatedOutput } from '../../../../../shared/application/dtos/search-output.dto'
import { OffsetInput } from '../../../../../shared/domain/query/criteria'
import { ProjectPrimitiveProps } from '../../domain/project-types'
import { SearchProjectsUseCase } from '../use-cases/search-projects-usecase.service'

@Injectable()
export class SearchProjectsHandler {
  constructor(private readonly useCase: SearchProjectsUseCase) {}

  async handle(input: OffsetInput): Promise<OffsetPaginatedOutput<ProjectPrimitiveProps>> {
    return this.useCase.invoke(input)
  }
}
