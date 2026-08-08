import { Nullable } from '../../../../shared/domain/types'
import { Criteria } from '../../../../shared/domain/query/criteria'
import { PropiedadId } from '../../../../shared/domain/value-objects/propiedades/propiedad-id.vo'
import { Propiedad } from './propiedad'

export abstract class PropiedadRepository {
  abstract register(propiedad: Propiedad): Promise<void>
  abstract save(propiedad: Propiedad): Promise<void>
  abstract remove(propiedadId: PropiedadId): Promise<void>
  abstract get(propiedadId: PropiedadId): Promise<Nullable<Propiedad>>
  abstract matching(criteria: Criteria): Promise<Propiedad[]>
  abstract exists(criteria: Criteria): Promise<boolean>
  abstract count(criteria: Criteria): Promise<number>
  // @ai:begin port-extra — finders no derivables (sync, agregaciones)
  // @ai:end
}
