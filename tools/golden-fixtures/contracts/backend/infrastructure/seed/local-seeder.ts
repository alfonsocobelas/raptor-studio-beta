import { AlreadyExistsError } from '../../../../../shared/domain/errors'
import { RegisterContractInput } from '../../application/dtos/register-contract-input.dto'
import { RegisterContractUseCase } from '../../application/use-cases/register-contract-usecase.service'

export interface ContractSeedSummary {
  contractsCreated: number
  contractsSkipped: number
}

// Siembra idempotente de contratos para el entorno local vía RegisterContractUseCase
// (respeta invariantes); los duplicados (contractNumber) se saltan capturando
// AlreadyExistsError.
export class ContractLocalSeeder {
  constructor(private readonly registerContract: RegisterContractUseCase) {}

  async seed(contracts: RegisterContractInput[]): Promise<ContractSeedSummary> {
    const summary: ContractSeedSummary = {
      contractsCreated: 0,
      contractsSkipped: 0
    }

    for (const contract of contracts) {
      try {
        await this.registerContract.invoke(contract)
        summary.contractsCreated++
      } catch (error) {
        if (error instanceof AlreadyExistsError) {
          summary.contractsSkipped++
          continue
        }
        throw error
      }
    }

    return summary
  }
}
