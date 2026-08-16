import { Nullable } from '../../../../shared/domain/types'
import { Criteria } from '../../../../shared/domain/query/criteria'
import { DeleteOperationId } from '../../../../shared/domain/value-objects/delete-operation-id.vo'
import { PuntoId } from '../../../../shared/domain/value-objects/puntos/punto-id.vo'
import { Punto } from './punto'

export abstract class PuntoRepository {
  abstract register(punto: Punto): Promise<void>
  abstract save(punto: Punto): Promise<void>
  abstract remove(puntoId: PuntoId, op: DeleteOperationId): Promise<void>
  abstract removeDraggedByClienteId(parentIds: string[], op: DeleteOperationId): Promise<string[]>
  abstract get(puntoId: PuntoId): Promise<Nullable<Punto>>
  abstract matching(criteria: Criteria): Promise<Punto[]>
  abstract exists(criteria: Criteria): Promise<boolean>
  abstract count(criteria: Criteria): Promise<number>
  abstract matchingDeleted(criteria: Criteria): Promise<Punto[]>
  abstract countDeleted(criteria: Criteria): Promise<number>
  abstract restore(puntoId: PuntoId): Promise<boolean>
  abstract restoreByOp(op: DeleteOperationId): Promise<number>
  abstract deletedOpOf(puntoId: PuntoId): Promise<Nullable<DeleteOperationId>>
  // @ai:begin port-extra — finders no derivables (sync, agregaciones)
  // @ai:end
}
