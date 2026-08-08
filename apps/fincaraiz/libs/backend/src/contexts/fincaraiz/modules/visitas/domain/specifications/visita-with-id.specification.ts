import { Criteria } from '../../../../../shared/domain/query/criteria'
import { Filter } from '../../../../../shared/domain/query/filter'
import { FilterField } from '../../../../../shared/domain/query/filter-field'
import { FilterOperator, Operator } from '../../../../../shared/domain/query/filter-operator'
import { FilterValue } from '../../../../../shared/domain/query/filter-value'
import { Filters } from '../../../../../shared/domain/query/filters'
import { VisitaId } from '../../../../../shared/domain/value-objects/visitas/visita-id.vo'

export class VisitaWithIdSpecification extends Criteria {
  private constructor(id: VisitaId) {
    super({
      filters: new Filters([
        new Filter(FilterField.create('id'), FilterOperator.create(Operator.EQUAL), FilterValue.create(id.value))
      ])
    })
  }

  static withId(id: VisitaId): VisitaWithIdSpecification {
    return new VisitaWithIdSpecification(id)
  }
}

export const withVisitaId = VisitaWithIdSpecification.withId
