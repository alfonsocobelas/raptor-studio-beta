import { Nullable } from '../../../../shared/domain/types'
import { Criteria } from '../../../../shared/domain/query/criteria'
import { DeleteOperationId } from '../../../../shared/domain/value-objects/delete-operation-id.vo'
import { ClienteId } from '../../../../shared/domain/value-objects/clientes/cliente-id.vo'
import { Cliente } from './cliente'

export abstract class ClienteRepository {
  abstract register(cliente: Cliente): Promise<void>
  abstract save(cliente: Cliente): Promise<void>
  abstract remove(clienteId: ClienteId, op: DeleteOperationId): Promise<void>
  abstract get(clienteId: ClienteId): Promise<Nullable<Cliente>>
  abstract matching(criteria: Criteria): Promise<Cliente[]>
  abstract exists(criteria: Criteria): Promise<boolean>
  abstract count(criteria: Criteria): Promise<number>
  abstract matchingDeleted(criteria: Criteria): Promise<Cliente[]>
  abstract countDeleted(criteria: Criteria): Promise<number>
  abstract restore(clienteId: ClienteId): Promise<boolean>
  abstract restoreByOp(op: DeleteOperationId): Promise<number>
  abstract deletedOpOf(clienteId: ClienteId): Promise<Nullable<DeleteOperationId>>
  // @ai:begin port-extra — finders no derivables (sync, agregaciones)
  // @ai:end
}
