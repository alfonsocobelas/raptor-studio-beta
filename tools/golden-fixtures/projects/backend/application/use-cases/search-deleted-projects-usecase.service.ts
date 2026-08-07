import { Injectable } from '@nestjs/common'
import { OffsetPaginatedOutput } from '../../../../../shared/application/dtos/search-output.dto'
import { Criteria, OffsetInput } from '../../../../../shared/domain/query/criteria'
import { getTotalPages } from '../../../../../shared/utils/pagination'
import { ProjectRepository } from '../../domain/project-repository'
import { ProjectPrimitiveProps } from '../../domain/project-types'
import searchProjectConfig from '../config/search-project-config'

// La papelera: el mismo search (config, filtros, paginación), sobre lo soft-borrado.
@Injectable()
export class SearchDeletedProjectsUseCase {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async invoke(input: OffsetInput): Promise<OffsetPaginatedOutput<ProjectPrimitiveProps>> {
    const { allowedFilters, allowedOrders, searchableFields } = searchProjectConfig
    const criteria = Criteria.fromOffset(input, allowedFilters, allowedOrders, searchableFields)

    const [projects, total] = await Promise.all([
      this.projectRepository.matchingDeleted(criteria),
      this.projectRepository.countDeleted(criteria)
    ])

    return {
      total,
      page: input.page,
      pageSize: input.pageSize,
      totalPages: getTotalPages({ pageSize: input.pageSize, total }),
      items: projects.map(project => project.toPrimitives())
    }
  }
}
