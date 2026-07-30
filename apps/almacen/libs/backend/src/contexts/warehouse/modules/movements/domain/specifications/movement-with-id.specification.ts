import { Criteria } from '../../../../../shared/domain/query/criteria'
import { Filter } from '../../../../../shared/domain/query/filter'
import { FilterField } from '../../../../../shared/domain/query/filter-field'
import { FilterOperator, Operator } from '../../../../../shared/domain/query/filter-operator'
import { FilterValue } from '../../../../../shared/domain/query/filter-value'
import { Filters } from '../../../../../shared/domain/query/filters'
import { MovementId } from '../../../../../shared/domain/value-objects/movements/movement-id.vo'

export class MovementWithIdSpecification extends Criteria {
  private constructor(id: MovementId) {
    super({
      filters: new Filters([
        new Filter(FilterField.create('id'), FilterOperator.create(Operator.EQUAL), FilterValue.create(id.value))
      ])
    })
  }

  static withId(id: MovementId): MovementWithIdSpecification {
    return new MovementWithIdSpecification(id)
  }
}

export const withMovementId = MovementWithIdSpecification.withId
