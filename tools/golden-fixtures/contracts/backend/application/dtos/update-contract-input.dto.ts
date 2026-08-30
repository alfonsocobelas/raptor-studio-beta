import { ContractUpdateProps } from '../../domain/contract-types'

export interface UpdateContractInput {
  id: string
  /** Versión que el cliente leyó (spec 78): si ya no es la actual, la escritura choca con 409 */
  version: number
  updates: ContractUpdateProps
}
