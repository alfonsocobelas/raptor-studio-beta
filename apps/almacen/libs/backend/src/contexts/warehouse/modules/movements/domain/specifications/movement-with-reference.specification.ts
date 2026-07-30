import { Criteria } from '../../../../../shared/domain/query/criteria'
import { Filter } from '../../../../../shared/domain/query/filter'
import { FilterField } from '../../../../../shared/domain/query/filter-field'
import { FilterOperator, Operator } from '../../../../../shared/domain/query/filter-operator'
import { FilterValue } from '../../../../../shared/domain/query/filter-value'
import { Filters } from '../../../../../shared/domain/query/filters'
import { MovementReference } from '../value-objects/movement-reference.vo'

export class MovementWithReferenceSpecification extends Criteria {
  private constructor(reference: MovementReference) {
    super({
      filters: new Filters([
        new Filter(
          FilterField.create('reference'),
          FilterOperator.create(Operator.EQUAL),
          FilterValue.create(reference.value)
        )
      ])
    })
  }

  static withReference(reference: MovementReference): MovementWithReferenceSpecification {
    return new MovementWithReferenceSpecification(reference)
  }
}

export const withReference = MovementWithReferenceSpecification.withReference
