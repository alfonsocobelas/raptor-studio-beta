import { Nullable } from '../../../../shared/domain/types'
import { Criteria } from '../../../../shared/domain/query/criteria'
import { ContractId } from '../../../../shared/domain/value-objects/contracts/contract-id.vo'
import { ContractNumber } from '../../../shared/domain/value-objects/contract-number.vo'
import { Contract } from './contract'

export abstract class ContractRepository {
  abstract register(contract: Contract): Promise<void>
  abstract save(contract: Contract): Promise<void>
  abstract get(contractId: ContractId): Promise<Nullable<Contract>>
  abstract matching(criteria: Criteria): Promise<Contract[]>
  abstract findByContractNumber(contractNumber: ContractNumber): Promise<Nullable<Contract>>
  abstract exists(criteria: Criteria): Promise<boolean>
  abstract count(criteria: Criteria): Promise<number>
}
