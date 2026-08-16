import { Criteria } from '../../../../../shared/domain/query/criteria'
import { Filter } from '../../../../../shared/domain/query/filter'
import { FilterField } from '../../../../../shared/domain/query/filter-field'
import { FilterOperator, Operator } from '../../../../../shared/domain/query/filter-operator'
import { FilterValue } from '../../../../../shared/domain/query/filter-value'
import { Filters } from '../../../../../shared/domain/query/filters'
import { PuntoId } from '../../../../../shared/domain/value-objects/puntos/punto-id.vo'

export class PuntoWithIdSpecification extends Criteria {
  private constructor(id: PuntoId) {
    super({
      filters: new Filters([
        new Filter(FilterField.create('id'), FilterOperator.create(Operator.EQUAL), FilterValue.create(id.value))
      ])
    })
  }

  static withId(id: PuntoId): PuntoWithIdSpecification {
    return new PuntoWithIdSpecification(id)
  }
}

export const withPuntoId = PuntoWithIdSpecification.withId
