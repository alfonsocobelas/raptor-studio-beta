import { Criteria } from '../../../../../shared/domain/query/criteria'
import { Filter } from '../../../../../shared/domain/query/filter'
import { FilterField } from '../../../../../shared/domain/query/filter-field'
import { FilterOperator, Operator } from '../../../../../shared/domain/query/filter-operator'
import { FilterValue } from '../../../../../shared/domain/query/filter-value'
import { Filters } from '../../../../../shared/domain/query/filters'
import { ParametroId } from '../../../../../shared/domain/value-objects/parametros/parametro-id.vo'

export class ParametroWithIdSpecification extends Criteria {
  private constructor(id: ParametroId) {
    super({
      filters: new Filters([
        new Filter(FilterField.create('id'), FilterOperator.create(Operator.EQUAL), FilterValue.create(id.value))
      ])
    })
  }

  static withId(id: ParametroId): ParametroWithIdSpecification {
    return new ParametroWithIdSpecification(id)
  }
}

export const withParametroId = ParametroWithIdSpecification.withId
