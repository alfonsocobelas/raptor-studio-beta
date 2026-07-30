import { Injectable } from '@nestjs/common'
import { AlreadyExistsError, EntityNotFoundError } from '../../../../../shared/domain/errors'
import { ContractRepository } from '../../domain/contract-repository'
import { withContractNumber } from '../../domain/specifications/contract-with-contract-number.specification'
import { ContractId } from '../../../../../shared/domain/value-objects/contracts/contract-id.vo'
import { UpdateContractInput } from '../dtos/update-contract-input.dto'

@Injectable()
export class UpdateContractUseCase {
  constructor(private readonly contractRepository: ContractRepository) {}

  async invoke(input: UpdateContractInput): Promise<void> {
    const contractId = ContractId.create(input.id)
    const contract = await this.contractRepository.get(contractId)

    if (!contract) {
      throw new EntityNotFoundError('Contract', input.id)
    }

    const newContractNumber = contract.newContractNumberIfChanged(input.updates)

    if (newContractNumber) {
      const contractNumberExists = await this.contractRepository.exists(withContractNumber(newContractNumber))

      if (contractNumberExists) {
        throw new AlreadyExistsError('Contract', 'contractNumber', newContractNumber.value)
      }
    }

    contract.updateDetails(input.updates)
    await this.contractRepository.save(contract)
  }
}
