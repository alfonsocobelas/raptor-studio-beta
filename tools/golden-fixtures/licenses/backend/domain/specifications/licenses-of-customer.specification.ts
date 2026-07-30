import { Criteria } from '../../../../../shared/domain/query/criteria'
import { Filter } from '../../../../../shared/domain/query/filter'
import { FilterField } from '../../../../../shared/domain/query/filter-field'
import { FilterOperator, Operator } from '../../../../../shared/domain/query/filter-operator'
import { FilterValue } from '../../../../../shared/domain/query/filter-value'
import { Filters } from '../../../../../shared/domain/query/filters'
import { CustomerId } from '../../../../../shared/domain/value-objects/customers/customer-id.vo'

export class LicensesOfCustomerSpecification extends Criteria {
  private constructor(customerId: CustomerId) {
    super({
      filters: new Filters([
        new Filter(
          FilterField.create('customerId'),
          FilterOperator.create(Operator.EQUAL),
          FilterValue.create(customerId.value)
        )
      ])
    })
  }

  static ofCustomer(customerId: CustomerId): LicensesOfCustomerSpecification {
    return new LicensesOfCustomerSpecification(customerId)
  }
}

export const licensesOfCustomer = LicensesOfCustomerSpecification.ofCustomer
