import { Criteria } from '../../../../../shared/domain/query/criteria'
import { Filter } from '../../../../../shared/domain/query/filter'
import { FilterField } from '../../../../../shared/domain/query/filter-field'
import { FilterOperator, Operator } from '../../../../../shared/domain/query/filter-operator'
import { FilterValue } from '../../../../../shared/domain/query/filter-value'
import { Filters } from '../../../../../shared/domain/query/filters'

/**
 * Proyectos ME_SAP con lifecycle activo: candidatos a archivar por ausencia en el feed de SAP
 * (spec 46). El filtro "visto en SAP" (lastSeenInSyncAt != null) se aplica en memoria en el
 * servicio, porque Criteria no expresa IS NOT NULL (mismo patrón que activeMeSapContracts/Licenses).
 */
export class ActiveMeSapProjectsSpecification extends Criteria {
  private constructor() {
    super({
      filters: new Filters([
        new Filter(FilterField.create('origin'), FilterOperator.create(Operator.EQUAL), FilterValue.create('ME_SAP')),
        new Filter(
          FilterField.create('lifecycleStatus'),
          FilterOperator.create(Operator.EQUAL),
          FilterValue.create('active')
        )
      ])
    })
  }

  static create(): ActiveMeSapProjectsSpecification {
    return new ActiveMeSapProjectsSpecification()
  }
}

export const activeMeSapProjects = ActiveMeSapProjectsSpecification.create
