import { Injectable } from '@nestjs/common'
import { ContractView } from '../../domain/contract-types'
import { GetContractInput } from '../dtos/get-contract-input.dto'
import { GetContractUseCase } from '../use-cases/get-contract-usecase.service'

@Injectable()
export class GetContractHandler {
  constructor(private readonly useCase: GetContractUseCase) {}

  async handle(input: GetContractInput): Promise<ContractView> {
    return this.useCase.invoke(input)
  }
}
