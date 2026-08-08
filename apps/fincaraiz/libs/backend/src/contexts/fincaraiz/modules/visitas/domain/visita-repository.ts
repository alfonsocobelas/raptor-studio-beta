import { Nullable } from '../../../../shared/domain/types'
import { Criteria } from '../../../../shared/domain/query/criteria'
import { VisitaId } from '../../../../shared/domain/value-objects/visitas/visita-id.vo'
import { Visita } from './visita'

export abstract class VisitaRepository {
  abstract register(visita: Visita): Promise<void>
  abstract save(visita: Visita): Promise<void>
  abstract remove(visitaId: VisitaId): Promise<void>
  abstract get(visitaId: VisitaId): Promise<Nullable<Visita>>
  abstract matching(criteria: Criteria): Promise<Visita[]>
  abstract exists(criteria: Criteria): Promise<boolean>
  abstract count(criteria: Criteria): Promise<number>
  // @ai:begin port-extra — finders no derivables (sync, agregaciones)
  // @ai:end
}
