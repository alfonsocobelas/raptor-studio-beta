import { Injectable } from '@nestjs/common'
import { AlreadyExistsError, EntityNotFoundError } from '../../../../../shared/domain/errors'
import { ContractRepository } from '../../domain/contract-repository'
import { CustomerRepository } from '../../../customers/domain/customer-repository'
import { CustomerId } from '../../../../../shared/domain/value-objects/customers/customer-id.vo'
import { withContractNumber } from '../../domain/specifications/contract-with-contract-number.specification'
import { ContractId } from '../../../../../shared/domain/value-objects/contracts/contract-id.vo'
import { UpdateContractInput } from '../dtos/update-contract-input.dto'

@Injectable()
export class UpdateContractUseCase {
  constructor(
    private readonly contractRepository: ContractRepository,
    private readonly customerRepository: CustomerRepository
  ) {}

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

    let updates = input.updates

    // La copia desnormalizada se refresca del canon cuando cambia el FK (spec 60).
    if (updates.customerId !== undefined) {
      const customer = await this.customerRepository.get(CustomerId.create(updates.customerId))

      if (!customer) {
        throw new EntityNotFoundError('Customer', updates.customerId)
      }

      updates = { ...updates, customerName: customer.name.value }
    }

    contract.updateDetails(updates)
    await this.contractRepository.save(contract)
  }
}
