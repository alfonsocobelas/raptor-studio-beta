import { Injectable } from '@nestjs/common'
import { EntityNotFoundError } from '../../../../../shared/domain/errors'
import { ContractId } from '../../../../../shared/domain/value-objects/contracts/contract-id.vo'
import { ContractRepository } from '../../domain/contract-repository'
import { ContractPrimitiveProps } from '../../domain/contract-types'
import { GetContractInput } from '../dtos/get-contract-input.dto'

@Injectable()
export class GetContractUseCase {
  constructor(private readonly contractRepository: ContractRepository) {}

  async invoke(input: GetContractInput): Promise<ContractPrimitiveProps> {
    const contractId = ContractId.create(input.id)
    const contract = await this.contractRepository.get(contractId)

    if (!contract) {
      throw new EntityNotFoundError('Contract', input.id)
    }

    return contract.toPrimitives()
  }
}
