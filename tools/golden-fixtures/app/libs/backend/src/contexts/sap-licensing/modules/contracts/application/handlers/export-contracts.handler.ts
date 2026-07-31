import { Injectable } from '@nestjs/common'
import { UnpaginatedInput } from '../../../../../shared/domain/query/criteria'
import { ContractPrimitiveProps } from '../../domain/contract-types'
import { ExportContractsUseCase } from '../use-cases/export-contracts-usecase.service'

@Injectable()
export class ExportContractsHandler {
  constructor(private readonly useCase: ExportContractsUseCase) {}

  async handle(input: UnpaginatedInput): Promise<ContractPrimitiveProps[]> {
    return this.useCase.invoke(input)
  }
}
