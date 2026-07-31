import { ContractUpdateProps } from '../../domain/contract-types'

export interface UpdateContractInput {
  id: string
  updates: ContractUpdateProps
}
