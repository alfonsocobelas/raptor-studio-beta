import { Injectable } from '@nestjs/common'
import { GetContractInput } from '../dtos/get-contract-input.dto'
import { GetContractUseCase } from '../use-cases/get-contract-usecase.service'
import { ContractPrimitiveProps } from '../../domain/contract-types'

@Injectable()
export class GetContractHandler {
  constructor(private readonly useCase: GetContractUseCase) {}

  async handle(input: GetContractInput): Promise<ContractPrimitiveProps> {
    return this.useCase.invoke(input)
  }
}
