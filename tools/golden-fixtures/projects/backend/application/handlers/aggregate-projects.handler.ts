import { Injectable } from '@nestjs/common'
import { AggregateInput, AggregateOutput } from '../../../../../shared/domain/query/aggregate'
import { AggregateProjectsUseCase } from '../use-cases/aggregate-projects-usecase.service'

@Injectable()
export class AggregateProjectsHandler {
  constructor(private readonly useCase: AggregateProjectsUseCase) {}

  async handle(input: AggregateInput): Promise<AggregateOutput> {
    return this.useCase.invoke(input)
  }
}
