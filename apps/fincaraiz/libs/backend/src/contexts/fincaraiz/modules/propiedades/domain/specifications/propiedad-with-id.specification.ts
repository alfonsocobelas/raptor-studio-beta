import { Criteria } from '../../../../../shared/domain/query/criteria'
import { Filter } from '../../../../../shared/domain/query/filter'
import { FilterField } from '../../../../../shared/domain/query/filter-field'
import { FilterOperator, Operator } from '../../../../../shared/domain/query/filter-operator'
import { FilterValue } from '../../../../../shared/domain/query/filter-value'
import { Filters } from '../../../../../shared/domain/query/filters'
import { PropiedadId } from '../../../../../shared/domain/value-objects/propiedades/propiedad-id.vo'

export class PropiedadWithIdSpecification extends Criteria {
  private constructor(id: PropiedadId) {
    super({
      filters: new Filters([
        new Filter(FilterField.create('id'), FilterOperator.create(Operator.EQUAL), FilterValue.create(id.value))
      ])
    })
  }

  static withId(id: PropiedadId): PropiedadWithIdSpecification {
    return new PropiedadWithIdSpecification(id)
  }
}

export const withPropiedadId = PropiedadWithIdSpecification.withId
