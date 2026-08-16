import { Nullable } from '../../../../shared/domain/types'
import { Criteria } from '../../../../shared/domain/query/criteria'
import { DeleteOperationId } from '../../../../shared/domain/value-objects/delete-operation-id.vo'
import { ParametroId } from '../../../../shared/domain/value-objects/parametros/parametro-id.vo'
import { Parametro } from './parametro'

export abstract class ParametroRepository {
  abstract register(parametro: Parametro): Promise<void>
  abstract save(parametro: Parametro): Promise<void>
  abstract remove(parametroId: ParametroId, op: DeleteOperationId): Promise<void>
  abstract get(parametroId: ParametroId): Promise<Nullable<Parametro>>
  abstract matching(criteria: Criteria): Promise<Parametro[]>
  abstract exists(criteria: Criteria): Promise<boolean>
  abstract count(criteria: Criteria): Promise<number>
  abstract matchingDeleted(criteria: Criteria): Promise<Parametro[]>
  abstract countDeleted(criteria: Criteria): Promise<number>
  abstract restore(parametroId: ParametroId): Promise<boolean>
  abstract restoreByOp(op: DeleteOperationId): Promise<number>
  // @ai:begin port-extra — finders no derivables (sync, agregaciones)
  // @ai:end
}
