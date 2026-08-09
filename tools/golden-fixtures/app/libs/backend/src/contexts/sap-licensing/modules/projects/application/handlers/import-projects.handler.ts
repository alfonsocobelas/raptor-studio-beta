import { Injectable } from '@nestjs/common'
import { ImportProjectsInput, ImportProjectsOutput } from '../dtos/import-projects-input.dto'
import { ImportProjectsUseCase } from '../use-cases/import-projects-usecase.service'

@Injectable()
export class ImportProjectsHandler {
  constructor(private readonly useCase: ImportProjectsUseCase) {}

  handle(input: ImportProjectsInput): Promise<ImportProjectsOutput> {
    return this.useCase.invoke(input)
  }
}
