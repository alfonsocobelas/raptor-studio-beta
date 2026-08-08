import { Nullable } from '../../../../shared/domain/types'
import { Criteria } from '../../../../shared/domain/query/criteria'
import { AgenteId } from '../../../../shared/domain/value-objects/agentes/agente-id.vo'
import { Agente } from './agente'

export abstract class AgenteRepository {
  abstract register(agente: Agente): Promise<void>
  abstract save(agente: Agente): Promise<void>
  abstract remove(agenteId: AgenteId): Promise<void>
  abstract get(agenteId: AgenteId): Promise<Nullable<Agente>>
  abstract matching(criteria: Criteria): Promise<Agente[]>
  abstract exists(criteria: Criteria): Promise<boolean>
  abstract count(criteria: Criteria): Promise<number>
  // @ai:begin port-extra — finders no derivables (sync, agregaciones)
  // @ai:end
}
