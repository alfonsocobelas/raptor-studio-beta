import { Injectable } from '@nestjs/common'
import { ConcurrencyConflictError, EntityNotFoundError } from '../../../../../shared/domain/errors'
import { ContractRepository } from '../../domain/contract-repository'
import { ContractId } from '../../../../../shared/domain/value-objects/contracts/contract-id.vo'

/** Transición «Expirar» de la máquina de estados (spec 43): cargar → transicionar → guardar. */
@Injectable()
export class ExpireContractUseCase {
  constructor(private readonly contractRepository: ContractRepository) {}

  async invoke(input: { id: string; version: number }): Promise<void> {
    const contractId = ContractId.create(input.id)
    const contract = await this.contractRepository.get(contractId)

    if (!contract) {
      throw new EntityNotFoundError('Contract', input.id)
    }

    // Bloqueo optimista (spec 78): dos transiciones simultáneas — la segunda choca con 409
    if (input.version !== contract.version) {
      throw new ConcurrencyConflictError('Contract', input.id)
    }

    contract.expire()
    await this.contractRepository.save(contract)
  }
}
