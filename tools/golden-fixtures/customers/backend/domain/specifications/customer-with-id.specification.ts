import { Criteria } from '../../../../../shared/domain/query/criteria'
import { Filter } from '../../../../../shared/domain/query/filter'
import { FilterField } from '../../../../../shared/domain/query/filter-field'
import { FilterOperator, Operator } from '../../../../../shared/domain/query/filter-operator'
import { FilterValue } from '../../../../../shared/domain/query/filter-value'
import { Filters } from '../../../../../shared/domain/query/filters'
import { CustomerId } from '../../../../../shared/domain/value-objects/customers/customer-id.vo'

export class CustomerWithIdSpecification extends Criteria {
  private constructor(id: CustomerId) {
    super({
      filters: new Filters([
        new Filter(FilterField.create('id'), FilterOperator.create(Operator.EQUAL), FilterValue.create(id.value))
      ])
    })
  }

  static withId(id: CustomerId): CustomerWithIdSpecification {
    return new CustomerWithIdSpecification(id)
  }
}

export const withCustomerId = CustomerWithIdSpecification.withId
