import { Nullable } from '../../../../shared/domain/types'
import { Criteria } from '../../../../shared/domain/query/criteria'
import { MovementId } from '../../../../shared/domain/value-objects/movements/movement-id.vo'
import { MovementReference } from './value-objects/movement-reference.vo'
import { Movement } from './movement'

export abstract class MovementRepository {
  abstract register(movement: Movement): Promise<void>
  abstract save(movement: Movement): Promise<void>
  abstract remove(movementId: MovementId): Promise<void>
  abstract get(movementId: MovementId): Promise<Nullable<Movement>>
  abstract matching(criteria: Criteria): Promise<Movement[]>
  abstract findByReference(reference: MovementReference): Promise<Nullable<Movement>>
  abstract exists(criteria: Criteria): Promise<boolean>
  abstract count(criteria: Criteria): Promise<number>
  // @ai:begin port-extra — finders no derivables (sync, agregaciones)
  // @ai:end
}
