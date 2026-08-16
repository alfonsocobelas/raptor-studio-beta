import { Criteria } from '../../../../../shared/domain/query/criteria'
import { Filter } from '../../../../../shared/domain/query/filter'
import { FilterField } from '../../../../../shared/domain/query/filter-field'
import { FilterOperator, Operator } from '../../../../../shared/domain/query/filter-operator'
import { FilterValue } from '../../../../../shared/domain/query/filter-value'
import { Filters } from '../../../../../shared/domain/query/filters'
import { MuestraId } from '../../../../../shared/domain/value-objects/muestras/muestra-id.vo'

export class MuestraWithIdSpecification extends Criteria {
  private constructor(id: MuestraId) {
    super({
      filters: new Filters([
        new Filter(FilterField.create('id'), FilterOperator.create(Operator.EQUAL), FilterValue.create(id.value))
      ])
    })
  }

  static withId(id: MuestraId): MuestraWithIdSpecification {
    return new MuestraWithIdSpecification(id)
  }
}

export const withMuestraId = MuestraWithIdSpecification.withId
