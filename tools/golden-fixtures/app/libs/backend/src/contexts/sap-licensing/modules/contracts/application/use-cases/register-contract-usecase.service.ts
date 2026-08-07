import { Injectable } from '@nestjs/common'
import { AlreadyExistsError } from '../../../../../shared/domain/errors'
import { Contract } from '../../domain/contract'
import { ContractRepository } from '../../domain/contract-repository'
import { withContractNumber } from '../../domain/specifications/contract-with-contract-number.specification'
import { RegisterContractInput } from '../dtos/register-contract-input.dto'

@Injectable()
export class RegisterContractUseCase {
  constructor(private readonly contractRepository: ContractRepository) {}

  async invoke(input: RegisterContractInput): Promise<void> {
    const contract = Contract.register(input)
    if (contract.contractNumber) {
      const contractNumberExists = await this.contractRepository.exists(withContractNumber(contract.contractNumber))

      if (contractNumberExists) {
        throw new AlreadyExistsError('Contract', 'contractNumber', contract.contractNumber.value)
      }
    }

    await this.contractRepository.register(contract)
  }
}
