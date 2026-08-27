import { Injectable } from '@nestjs/common'
import { AggregateInput, AggregateOutput } from '../../../../../shared/domain/query/aggregate'
import { AggregateLicensesUseCase } from '../use-cases/aggregate-licenses-usecase.service'

@Injectable()
export class AggregateLicensesHandler {
  constructor(private readonly useCase: AggregateLicensesUseCase) {}

  async handle(input: AggregateInput): Promise<AggregateOutput> {
    return this.useCase.invoke(input)
  }
}
