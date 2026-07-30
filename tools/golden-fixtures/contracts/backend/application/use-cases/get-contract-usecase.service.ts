import { Injectable } from '@nestjs/common'
import { EntityNotFoundError } from '../../../../../shared/domain/errors'
import { ContractId } from '../../../../../shared/domain/value-objects/contracts/contract-id.vo'
import { ContractLicenseValueReader } from '../../domain/contract-license-value-reader'
import { ContractRepository } from '../../domain/contract-repository'
import { ContractView } from '../../domain/contract-types'
import { GetContractInput } from '../dtos/get-contract-input.dto'

@Injectable()
export class GetContractUseCase {
  constructor(
    private readonly contractRepository: ContractRepository,
    private readonly licenseValueReader: ContractLicenseValueReader
  ) {}

  async invoke(input: GetContractInput): Promise<ContractView> {
    const contractId = ContractId.create(input.id)
    const contract = await this.contractRepository.get(contractId)

    if (!contract) {
      throw new EntityNotFoundError('Contract', input.id)
    }

    const primitives = contract.toPrimitives()
    // Valor derivado (spec 40) de la suma del annualValue de sus licencias; sin licencias → null
    const totalValues = await this.licenseValueReader.totalValueByContractIds([primitives.id])
    return { ...primitives, totalValue: totalValues[primitives.id] ?? null }
  }
}
