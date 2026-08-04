import { Injectable } from '@nestjs/common'
import { OffsetPaginatedOutput } from '../../../../../shared/application/dtos/search-output.dto'
import { OffsetInput } from '../../../../../shared/domain/query/criteria'
import { ContractPrimitiveProps } from '../../domain/contract-types'
import { SearchContractsUseCase } from '../use-cases/search-contracts-usecase.service'

@Injectable()
export class SearchContractsHandler {
  constructor(private readonly useCase: SearchContractsUseCase) {}

  async handle(input: OffsetInput): Promise<OffsetPaginatedOutput<ContractPrimitiveProps>> {
    return this.useCase.invoke(input)
  }
}
