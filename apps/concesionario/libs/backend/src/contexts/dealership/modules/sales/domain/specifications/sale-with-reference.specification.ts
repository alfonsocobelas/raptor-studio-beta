import { Criteria } from '../../../../../shared/domain/query/criteria'
import { Filter } from '../../../../../shared/domain/query/filter'
import { FilterField } from '../../../../../shared/domain/query/filter-field'
import { FilterOperator, Operator } from '../../../../../shared/domain/query/filter-operator'
import { FilterValue } from '../../../../../shared/domain/query/filter-value'
import { Filters } from '../../../../../shared/domain/query/filters'
import { SaleReference } from '../value-objects/sale-reference.vo'

export class SaleWithReferenceSpecification extends Criteria {
  private constructor(reference: SaleReference) {
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

  static withReference(reference: SaleReference): SaleWithReferenceSpecification {
    return new SaleWithReferenceSpecification(reference)
  }
}

export const withReference = SaleWithReferenceSpecification.withReference
