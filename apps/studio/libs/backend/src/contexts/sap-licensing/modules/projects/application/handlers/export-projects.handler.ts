import { Injectable } from '@nestjs/common'
import { UnpaginatedInput } from '../../../../../shared/domain/query/criteria'
import { ProjectPrimitiveProps } from '../../domain/project-types'
import { ExportProjectsUseCase } from '../use-cases/export-projects-usecase.service'

@Injectable()
export class ExportProjectsHandler {
  constructor(private readonly useCase: ExportProjectsUseCase) {}

  async handle(input: UnpaginatedInput): Promise<ProjectPrimitiveProps[]> {
    return this.useCase.invoke(input)
  }
}
