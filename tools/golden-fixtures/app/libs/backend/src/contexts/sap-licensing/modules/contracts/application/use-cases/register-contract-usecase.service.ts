import { Injectable } from '@nestjs/common'
import { AlreadyExistsError, EntityNotFoundError } from '../../../../../shared/domain/errors'
import { Contract } from '../../domain/contract'
import { ContractRepository } from '../../domain/contract-repository'
import { CustomerRepository } from '../../../customers/domain/customer-repository'
import { CustomerId } from '../../../../../shared/domain/value-objects/customers/customer-id.vo'
import { withContractNumber } from '../../domain/specifications/contract-with-contract-number.specification'
import { RegisterContractInput } from '../dtos/register-contract-input.dto'

@Injectable()
export class RegisterContractUseCase {
  constructor(
    private readonly contractRepository: ContractRepository,
    private readonly customerRepository: CustomerRepository
  ) {}

  async invoke(input: RegisterContractInput): Promise<void> {
    // El valor desnormalizado se copia del canon, nunca del DTO (spec 60).
    const customer = await this.customerRepository.get(CustomerId.create(input.customerId))

    if (!customer) {
      throw new EntityNotFoundError('Customer', input.customerId)
    }

    const contract = Contract.register({ ...input, customerName: customer.name.value })
    if (contract.contractNumber) {
      const contractNumberExists = await this.contractRepository.exists(withContractNumber(contract.contractNumber))

      if (contractNumberExists) {
        throw new AlreadyExistsError('Contract', 'contractNumber', contract.contractNumber.value)
      }
    }

    await this.contractRepository.register(contract)
  }
}
