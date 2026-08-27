import { Injectable } from '@nestjs/common'
import { AggregateInput, AggregateOutput } from '../../../../../shared/domain/query/aggregate'
import { AggregateCustomersUseCase } from '../use-cases/aggregate-customers-usecase.service'

@Injectable()
export class AggregateCustomersHandler {
  constructor(private readonly useCase: AggregateCustomersUseCase) {}

  async handle(input: AggregateInput): Promise<AggregateOutput> {
    return this.useCase.invoke(input)
  }
}
