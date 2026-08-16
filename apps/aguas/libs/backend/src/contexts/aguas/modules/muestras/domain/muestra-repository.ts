import { Nullable } from '../../../../shared/domain/types'
import { Criteria } from '../../../../shared/domain/query/criteria'
import { DeleteOperationId } from '../../../../shared/domain/value-objects/delete-operation-id.vo'
import { MuestraId } from '../../../../shared/domain/value-objects/muestras/muestra-id.vo'
import { Muestra } from './muestra'

export abstract class MuestraRepository {
  abstract register(muestra: Muestra): Promise<void>
  abstract save(muestra: Muestra): Promise<void>
  abstract remove(muestraId: MuestraId, op: DeleteOperationId): Promise<void>
  abstract removeDraggedByPuntoId(parentIds: string[], op: DeleteOperationId): Promise<string[]>
  abstract get(muestraId: MuestraId): Promise<Nullable<Muestra>>
  abstract matching(criteria: Criteria): Promise<Muestra[]>
  abstract exists(criteria: Criteria): Promise<boolean>
  abstract count(criteria: Criteria): Promise<number>
  abstract matchingDeleted(criteria: Criteria): Promise<Muestra[]>
  abstract countDeleted(criteria: Criteria): Promise<number>
  abstract restore(muestraId: MuestraId): Promise<boolean>
  abstract restoreByOp(op: DeleteOperationId): Promise<number>
  // @ai:begin port-extra — finders no derivables (sync, agregaciones)
  // @ai:end
}
