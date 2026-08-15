import { Injectable } from '@nestjs/common'
import { EntityNotFoundError } from '../../../../../shared/domain/errors'
import { ContractRepository } from '../../domain/contract-repository'
import { ContractId } from '../../../../../shared/domain/value-objects/contracts/contract-id.vo'

/** Transición «Terminar» de la máquina de estados (spec 43): cargar → transicionar → guardar. */
@Injectable()
export class TerminateContractUseCase {
  constructor(private readonly contractRepository: ContractRepository) {}

  async invoke(input: { id: string }): Promise<void> {
    const contractId = ContractId.create(input.id)
    const contract = await this.contractRepository.get(contractId)

    if (!contract) {
      throw new EntityNotFoundError('Contract', input.id)
    }

    contract.terminate()
    await this.contractRepository.save(contract)
  }
}
