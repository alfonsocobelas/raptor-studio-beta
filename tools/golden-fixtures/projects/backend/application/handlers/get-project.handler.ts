import { Injectable } from '@nestjs/common'
import { ProjectPrimitiveProps } from '../../domain/project-types'
import { GetProjectInput } from '../dtos/get-project-input.dto'
import { GetProjectUseCase } from '../use-cases/get-project-usecase.service'

@Injectable()
export class GetProjectHandler {
  constructor(private readonly useCase: GetProjectUseCase) {}

  async handle(input: GetProjectInput): Promise<ProjectPrimitiveProps> {
    return this.useCase.invoke(input)
  }
}
