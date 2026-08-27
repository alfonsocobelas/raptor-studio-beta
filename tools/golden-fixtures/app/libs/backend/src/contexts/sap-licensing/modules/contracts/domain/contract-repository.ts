import { Nullable } from '../../../../shared/domain/types'
import { AggregateGroup, AggregateOp, GroupedSpec } from '../../../../shared/domain/query/aggregate'
import { DeleteOperationId } from '../../../../shared/domain/value-objects/delete-operation-id.vo'
import { Criteria } from '../../../../shared/domain/query/criteria'
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
  /** Una agregación del conjunto filtrado (spec 71). `null` = no hay dato, que no es lo mismo que 0. */
  abstract aggregate(criteria: Criteria, op: AggregateOp, field: string): Promise<number | null>
  /** El desglose de una agregación, en una sola consulta (spec 72). */
  abstract aggregateGrouped(criteria: Criteria, spec: GroupedSpec): Promise<AggregateGroup[]>
  // @ai:begin port-extra — finders no derivables (sync, agregaciones)
  // @ai:end
}
