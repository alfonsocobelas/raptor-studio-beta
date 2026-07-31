import { Contract } from '../../../../../src/contexts/sap-licensing/modules/contracts/domain/contract'
import { ContractPrimitiveProps } from '../../../../../src/contexts/sap-licensing/modules/contracts/domain/contract-types'
import { ContractBuilder } from './contract.builder'

export class ContractMother {
  static random(): Contract {
    return ContractBuilder.aContract().build()
  }

  static randomList(count: number = 5): Contract[] {
    return Array.from({ length: count }, () => this.random())
  }

  static register(overrides?: Partial<ContractPrimitiveProps>): Contract {
    return ContractBuilder.aContract().withProps(overrides).create()
  }

  static reconstruct(overrides?: Partial<ContractPrimitiveProps>): Contract {
    return ContractBuilder.aContract().withProps(overrides).build()
  }

  static withContractNumber(contractNumber: string): Contract {
    return ContractBuilder.aContract().withContractNumber(contractNumber).build()
  }

  static primitives(overrides?: Partial<ContractPrimitiveProps>): ContractPrimitiveProps {
    return ContractBuilder.aContract().withProps(overrides).build().toPrimitives()
  }
}
