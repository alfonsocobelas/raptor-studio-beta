import { Injectable, Optional } from '@nestjs/common'
import { Criteria, UnpaginatedInput } from '../../../../../shared/domain/query/criteria'
import { ExportTooLargeError } from '../../../../../shared/domain/errors'
import { EXPORT_ROW_LIMIT } from '../../../../../shared/infrastructure/export/export-limit'
import { ProjectRepository } from '../../domain/project-repository'
import { ProjectPrimitiveProps } from '../../domain/project-types'
import searchProjectConfig from '../config/search-project-config'

@Injectable()
export class ExportProjectsUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    @Optional() private readonly rowLimit: number = EXPORT_ROW_LIMIT
  ) {}

  async invoke(input: UnpaginatedInput): Promise<ProjectPrimitiveProps[]> {
    const { allowedFilters, allowedOrders, searchableFields } = searchProjectConfig
    const criteria = Criteria.fromUnpaginated(
      input,
      allowedFilters as string[],
      allowedOrders as string[],
      searchableFields as string[]
    )

    const total = await this.projectRepository.count(criteria)
    if (total > this.rowLimit) {
      throw new ExportTooLargeError(total, this.rowLimit)
    }

    const projects = await this.projectRepository.matching(criteria)
    return projects.map(project => project.toPrimitives())
  }
}
