import { Nullable } from '../../../../shared/domain/types'
import { Criteria } from '../../../../shared/domain/query/criteria'
import { DeleteOperationId } from '../../../../shared/domain/value-objects/delete-operation-id.vo'
import { ContractId } from '../../../../shared/domain/value-objects/contracts/contract-id.vo'
import { ContractNumber } from '../../../shared/domain/value-objects/contract-number.vo'
import { Contract } from './contract'

export abstract class ContractRepository {
  abstract register(contract: Contract): Promise<void>
  abstract save(contract: Contract): Promise<void>
  abstract removeDraggedByCustomerId(parentIds: string[], op: DeleteOperationId): Promise<string[]>
  abstract get(contractId: ContractId): Promise<Nullable<Contract>>
  abstract matching(criteria: Criteria): Promise<Contract[]>
  abstract findByContractNumber(contractNumber: ContractNumber): Promise<Nullable<Contract>>
  abstract exists(criteria: Criteria): Promise<boolean>
  abstract count(criteria: Criteria): Promise<number>
  // @ai:begin port-extra — finders no derivables (sync, agregaciones)
  // @ai:end
}
