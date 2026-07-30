import { Criteria } from '../../../../../shared/domain/query/criteria'
import { Filter } from '../../../../../shared/domain/query/filter'
import { FilterField } from '../../../../../shared/domain/query/filter-field'
import { FilterOperator, Operator } from '../../../../../shared/domain/query/filter-operator'
import { FilterValue } from '../../../../../shared/domain/query/filter-value'
import { Filters } from '../../../../../shared/domain/query/filters'
import { CustomerId } from '../../../../../shared/domain/value-objects/customers/customer-id.vo'
import { ProjectName } from '../value-objects/project-name.vo'

export class ProjectWithCustomerAndNameSpecification extends Criteria {
  private constructor(customerId: CustomerId, name: ProjectName) {
    super({
      filters: new Filters([
        new Filter(
          FilterField.create('customerId'),
          FilterOperator.create(Operator.EQUAL),
          FilterValue.create(customerId.value)
        ),
        new Filter(FilterField.create('name'), FilterOperator.create(Operator.EQUAL), FilterValue.create(name.value))
      ])
    })
  }

  static withCustomerIdAndName(customerId: CustomerId, name: ProjectName): ProjectWithCustomerAndNameSpecification {
    return new ProjectWithCustomerAndNameSpecification(customerId, name)
  }
}

export const withCustomerIdAndName = ProjectWithCustomerAndNameSpecification.withCustomerIdAndName
