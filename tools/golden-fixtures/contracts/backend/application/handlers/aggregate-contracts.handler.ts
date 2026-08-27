import { Injectable } from '@nestjs/common'
import { AggregateInput, AggregateOutput } from '../../../../../shared/domain/query/aggregate'
import { AggregateContractsUseCase } from '../use-cases/aggregate-contracts-usecase.service'

@Injectable()
export class AggregateContractsHandler {
  constructor(private readonly useCase: AggregateContractsUseCase) {}

  async handle(input: AggregateInput): Promise<AggregateOutput> {
    return this.useCase.invoke(input)
  }
}
