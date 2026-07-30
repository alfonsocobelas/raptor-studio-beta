import { Criteria } from '../../../../../shared/domain/query/criteria'
import { Filter } from '../../../../../shared/domain/query/filter'
import { FilterField } from '../../../../../shared/domain/query/filter-field'
import { FilterOperator, Operator } from '../../../../../shared/domain/query/filter-operator'
import { FilterValue } from '../../../../../shared/domain/query/filter-value'
import { Filters } from '../../../../../shared/domain/query/filters'

// Batch lookup by internal id (id IN [...]), used to enrich list views with customer data
// in a single query. Callers must pass a non-empty list.
export class CustomersByIdsSpecification extends Criteria {
  private constructor(ids: string[]) {
    super({
      filters: new Filters([
        new Filter(FilterField.create('id'), FilterOperator.create(Operator.IN), FilterValue.create(ids))
      ])
    })
  }

  static withIds(ids: string[]): CustomersByIdsSpecification {
    return new CustomersByIdsSpecification(ids)
  }
}

export const customersByIds = CustomersByIdsSpecification.withIds
