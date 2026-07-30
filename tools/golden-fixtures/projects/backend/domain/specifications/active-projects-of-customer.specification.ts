import { Criteria } from '../../../../../shared/domain/query/criteria'
import { Filter } from '../../../../../shared/domain/query/filter'
import { FilterField } from '../../../../../shared/domain/query/filter-field'
import { FilterOperator, Operator } from '../../../../../shared/domain/query/filter-operator'
import { FilterValue } from '../../../../../shared/domain/query/filter-value'
import { Filters } from '../../../../../shared/domain/query/filters'
import { CustomerId } from '../../../../../shared/domain/value-objects/customers/customer-id.vo'
import { ProjectStatusValue } from '../value-objects/project-status.vo'

// «Activo» a efectos de negocio: en marcha o arrancando (misma semántica que el prototipo).
const ACTIVE_LIKE_STATUSES: readonly ProjectStatusValue[] = ['planning', 'active']

export class ActiveProjectsOfCustomerSpecification extends Criteria {
  private constructor(customerId: CustomerId) {
    super({
      filters: new Filters([
        new Filter(
          FilterField.create('customerId'),
          FilterOperator.create(Operator.EQUAL),
          FilterValue.create(customerId.value)
        ),
        new Filter(
          FilterField.create('status'),
          FilterOperator.create(Operator.IN),
          FilterValue.create([...ACTIVE_LIKE_STATUSES])
        )
      ])
    })
  }

  static ofCustomer(customerId: CustomerId): ActiveProjectsOfCustomerSpecification {
    return new ActiveProjectsOfCustomerSpecification(customerId)
  }
}

export const activeProjectsOfCustomer = ActiveProjectsOfCustomerSpecification.ofCustomer
