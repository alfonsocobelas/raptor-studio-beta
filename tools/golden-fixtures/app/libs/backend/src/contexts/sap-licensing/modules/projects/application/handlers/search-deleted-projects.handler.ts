import { Injectable } from '@nestjs/common'
import { OffsetPaginatedOutput } from '../../../../../shared/application/dtos/search-output.dto'
import { OffsetInput } from '../../../../../shared/domain/query/criteria'
import { ProjectPrimitiveProps } from '../../domain/project-types'
import { SearchDeletedProjectsUseCase } from '../use-cases/search-deleted-projects-usecase.service'

@Injectable()
export class SearchDeletedProjectsHandler {
  constructor(private readonly useCase: SearchDeletedProjectsUseCase) {}

  async handle(input: OffsetInput): Promise<OffsetPaginatedOutput<ProjectPrimitiveProps>> {
    return this.useCase.invoke(input)
  }
}
